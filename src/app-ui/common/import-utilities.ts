import { Observable, Subject, take, takeUntil } from "rxjs";
import { SzDataFile, SzDataFileInfo, SzImportedDataFile, SzImportedFileAnalysis, SzImportedFilesAnalysisDataSource } from "../models/data-files";
import { isNotNull } from "./utils";
import { SzGrpcConfigManagerService, SzGrpcEngineService, SzGrpcProductService, SzSdkDataSource } from "@senzing/eval-tool-ui-common";
import { ElementRef, Inject } from "@angular/core";
import { SzGrpcWebEnvironment } from "@senzing/sz-sdk-typescript-grpc-web";

export enum lineEndingStyle {
    Windows = '\r\n',
    MacOs = '\n',
    Linux = '\n',
    default = '\n',
    unknown = '\r'
}
export type LineEndingStyleStrings = keyof typeof lineEndingStyle;

export enum validImportFileTypes {
    CSV = 'csv',
    JSONL = 'jsonl',
    JSON = 'json'
}

export function determineLineEndingStyle(text: string): lineEndingStyle.Linux | lineEndingStyle.MacOs | lineEndingStyle.Windows | lineEndingStyle.default | lineEndingStyle.unknown {
    let retVal = lineEndingStyle.default;
    const indexOfLF = text.indexOf('\n', 1);  // No need to check first-character
    if(indexOfLF === -1) {
        if(text.indexOf('\r') !== -1) {
            retVal = lineEndingStyle.unknown;
        } else {
            retVal = lineEndingStyle.Linux;
        }
    } else {
        if (text[indexOfLF - 1] === '\r'){
            retVal = lineEndingStyle.Windows; // is '\r\n'
        }
    }
    return retVal;
}

export function lineEndingStyleAsEnumKey(value: lineEndingStyle.Linux | lineEndingStyle.MacOs | lineEndingStyle.Windows | lineEndingStyle.default | lineEndingStyle.unknown): "Linux" | "Windows" | "MacOs" | "default" | "unknown" {
    let retVal;
    if(value === lineEndingStyle.Linux){ retVal = "Linux"; }
    if(value === lineEndingStyle.MacOs){ retVal = "MacOs"; }
    if(value === lineEndingStyle.Windows){ retVal = "Windows"; }
    if(value === lineEndingStyle.unknown){ retVal = "unknown"; }
    if(retVal === undefined){ retVal = "default";}
    return retVal;
}

/**
 * detect what line endings are majority present in a file or string
 */
export function detectLineEndings(text) {
    let countResults = new Map([
      ['\r\n',  (text.indexOf('\r\n') !== -1) ?  text.split('\r\n').length : 0],
      ['\n',    (text.indexOf('\n') !== -1) ?    text.split('\n').length   : 0],
      ['\r',    (text.indexOf('\r') !== -1) ?    text.split('\r').length   : 0]
    ])
    const sortedResults = [...countResults.entries()].sort(([, a], [, b]) => b - a);
    let retVal = sortedResults[0][0];
    //console.log(`detectLineEndings: ${retVal}`, sortedResults);
    return retVal;
}

export function getFileTypeFromName(file: File): validImportFileTypes.JSONL | validImportFileTypes.JSON | validImportFileTypes.CSV | undefined {
    let retVal = undefined;
    if(file && file.name) {
        let fileName    = file.name;
        let fileExt     = fileName.substr(fileName.lastIndexOf('.')+1);
        fileExt         = fileExt.toLowerCase().trim();
        switch(fileExt) {
            case validImportFileTypes.CSV:
                retVal = validImportFileTypes.CSV;
                break;
            case validImportFileTypes.JSONL:
                retVal = validImportFileTypes.JSONL;
                break;
            case validImportFileTypes.JSON:
                retVal = validImportFileTypes.JSON;
                break;
        }
    } else {
        // I dunno, maybe infer from content sample???
    }
    return retVal;
}

export class importHelper {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$   = new Subject<void>();
    private _dataSources: SzSdkDataSource[];
    public defaultConfigId: number;
    public configDefinition: string;
    public isInProgress = false;
    private _results;
    public dataFiles: SzImportedDataFile[];
    public dataSourcesToRemap = new Map<string, string>;
    public results;
    public currentError: Error;
    
    private _jsonTypes  = [
        'application/json',
        'application/ld+json'
    ];
    private _csvTypes   = [
        'text/csv'
    ]

    //@ViewChild('fileInput') public _fileInputElement: ElementRef;
    
    public get analysisAsString(): string {
      let analysisPerFile = this.dataFiles.map((ds) => {
        return ds.analysis ? JSON.stringify(ds.analysis) : '';
      });
      return `[${analysisPerFile.join(',\n')}]`;
    }
    //private get fileInputElement(): HTMLInputElement {
    //    return this._fileInputElement.nativeElement as HTMLInputElement;
    //}
    public get displayedColumns(): string[] {
        const retVal = [];
        if( this.hasBlankDataSource) {
        retVal.push('name');
        }
        retVal.push('recordCount', 'recordsWithRecordIdCount','originalName');
        return retVal;
    }
    public get hasBlankDataSource() {
        let retVal =  false;
        if(this.dataFiles && this.dataFiles.some) {
          retVal = this.dataFiles.some((datafile)=> {
            return datafile.analysis.recordsWithDataSourceCount < datafile.analysis.recordCount;
          })
        } 
        return retVal;
    }
    public get dataSourcesForPulldown() {
        let retVal = this._dataSources;
        return retVal;
    }
    private get dataSourcesAsMap() : Map<string, number> {
        let retVal = new Map<string, number>();
        this._dataSources?.forEach((dsItem) => {
        retVal.set(dsItem.DSRC_CODE, dsItem.DSRC_ID);
        })
        return retVal;
    }
    public get dataCanBeLoaded(): boolean {
        let retVal = !this.isInProgress && (this.dataFiles ? true : false);
        if(this.hasBlankDataSource) {
          retVal = retVal && this.dataSourcesToRemap.has('NONE');
        }
        return retVal;
    }
    
    private getDataSources() {
        let retVal = new Subject<SzSdkDataSource[]>();
        this.configManagerService.config.then((conf)=> {
        conf.dataSources.pipe(
            takeUntil(this.unsubscribe$),
            take(1)
        ).subscribe((dsResp: SzSdkDataSource[]) =>{
            retVal.next(dsResp);
        })
        });
        return retVal;
    }

    constructor(
        @Inject('GRPC_ENVIRONMENT') private SdkEnvironment: SzGrpcWebEnvironment,
        private productService: SzGrpcProductService,
        private engineService: SzGrpcEngineService,
        private configManagerService: SzGrpcConfigManagerService
    ) {}

    public getIsNew(value: boolean): boolean | undefined {
        return (value === true) ? value : false;
    }
    public isNewDataSource(value: string): boolean {
        //return true;
        return value && (value.trim().length > 0) && !(this.dataSourcesAsMap.has(value));
    }
    public isMappedNewDataSource(originalName: string): boolean {
        //return true;
        return originalName && (originalName.trim().length > 0) ? !this.dataSourcesAsMap.has(originalName) : !this.dataSourcesAsMap.has(this.dataSourcesToRemap.get('NONE'));
        //return !this.dataSourcesAsMap.has(nameToLookFor);
        //return originalName && (originalName.trim().length > 0) && !(this.dataSourcesAsMap.has(originalName));
    }
    public isBlankDataSource(originalName: string): boolean {
        return originalName && isNotNull(originalName) ? true : false;
    }

    public reinitEngine() {
        this.engineService.reinitialize(this.defaultConfigId).pipe(
        takeUntil(this.unsubscribe$)
        ).subscribe((resp)=>{
        console.log(`huh? `, resp)
        })
    }
    public reinitEnvironment() {
        this.SdkEnvironment.reinitialize(this.defaultConfigId);
    }

    public addRecords(records: Array<{[key: string]: any}>){
        let retVal = new Subject<any>()
        this.engineService.addRecords(records).pipe(
        takeUntil(this.unsubscribe$)
        ).subscribe((result)=> {
        retVal.next(result);
        });
        return retVal.asObservable();
    }

    /** when user changes the destination for a datasource */
    public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
        let _srcKey   = fromDataSource && fromDataSource.trim() !== '' ? fromDataSource : 'NONE';
        let _destKey  = toDataSource;
        this.dataSourcesToRemap.set(_srcKey, _destKey);
        console.log(`handleDataSourceChange: "${_srcKey}" => ${_destKey}`, this.dataSourcesToRemap);

        //this.adminBulkDataService.changeDataSourceName(fromDataSource, toDataSource);
    }
    public ifNotEmpty(value: any) {
        let retVal = isNotNull(value) ? value : '';
        return retVal;
    }

    /*public onFilesChanged(event) {
        this.analyzeFiles().pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe((response)=> {
            this.analysis    = response;
        })
    }*/
    public static getFileName(url: string) : string {
      return url.replace(/^.*\/([^\/]+)$/g,"$1");
    }
    public static getFilePath(url: string) : string {
      return url.substring("file://".length);
    }

    //public analyzeFiles(files: File[]): Observable<SzImportedFilesAnalysis[]> {
    public analyzeFiles(files: File[]): Observable<SzImportedDataFile[]> {
        let _fArr             = files;
        let _dataFiles        = new Map<string, SzImportedDataFile>();
        let _dataSources      = new Map<string, {recordCount: number, recordsWithRecordIdCount: number}>();
        let _defaultConfigId: number;
        let retVal            = new Subject<SzImportedDataFile[]>();
        let topLevelStats     = {
          recordCount: 0,
          recordsWithRecordIdCount: 0,
          recordsWithDataSourceCount: 0
        }
        console.log(`parseFile: `, _fArr);
        
        for(let i=0; i <= (_fArr.length - 1); i++) {
          let _file       = _fArr[i];
          let path        = _file["path"];
          const name      = _file["name"];
          const origPath  = path;
          let _fileContents = "";
          let isJSON      = this._jsonTypes.includes(_file.type);
          let isCSV       = this._csvTypes.includes(_file.type);
    
          const fileInfo : SzImportedDataFile = {
                url: importHelper.getFileName(name),
                format: name.replace(/.*\.([^\.]+)/g, "$1"),
                name: importHelper.getFileName(name),
                uploadName: importHelper.getFileName(name),
                totalSize: _file.size,
                timestamp: new Date(_file.lastModified)
          };
    
          if (path) {
                if (path.substring(1).startsWith(":\\") || path.startsWith("\\\\"))
                {
                    path = path.replace(/\\/g, "/");
                }
                fileInfo.url        = "file://" + path;
                fileInfo.name       = SzDataFile.getName(fileInfo.url);
                fileInfo.uploadName = SzDataFile.getName(fileInfo.url);
                fileInfo.format     = fileInfo.url.replace(/.*\.([^\.]+)/g, "$1");
          }
    
            /*if (files.findIndex(dataFile => dataFile.url === fileInfo.url) >= 0) {
                existingFiles.push(name);
                return;
            }*/
    
            const suffixStart = fileInfo.name.lastIndexOf(".");
            const fileSuffix = (suffixStart < 0) ? ""
            : fileInfo.name.substring(suffixStart).toLowerCase();


          if(!isJSON || isCSV) {
            // try and figure out if it's "text/plain" if it's actually 
            // a csv or json file masquerading as a plain text file
          }
          // add entry to return map
          if(!_dataFiles.has(fileInfo.uploadName)) {
            _dataFiles.set(fileInfo.uploadName, fileInfo);
          }
    
          const reader  = new FileReader();
          reader.onload = () => {
            _fileContents += reader.result;
            //convert text to json here
            //var json = this.csvJSON(text);
          };
          reader.onloadend = () => {
            const lineEndingStyle = detectLineEndings(_fileContents);
            console.log(`line ending style: "${lineEndingStyle}"`);
            const lines           = _fileContents.split(lineEndingStyle);
            if(lines && lines.length <= 1) {
              // assume it's one line ???
              console.warn(`whut? "${lineEndingStyle}"`, lineEndingStyle);
              return;
            }
            //console.log(`parseFile: on read end.`, lineEndingStyle, lines);
    
            if(isJSON) {
    
            } else if(isCSV) {
              // get column headers indexes
              let columns     = (lines.shift()).split(',');
              let dsIndex     = columns.indexOf('DATA_SOURCE');
              let linesAsJSON = [];
              
              lines.filter((_l, index)=>{
                return isNotNull(_l);
              }).forEach((_l, index) => {
                let _dsName   = _l.split(',')[dsIndex];
                let _existingDataSource = _dataSources.has(_dsName) ? _dataSources.get(_dsName) : undefined;
                let _recordCount      = _existingDataSource ? _existingDataSource.recordCount : 0;
                let _recordsWithRecId  = _existingDataSource ? _existingDataSource.recordsWithRecordIdCount : 0;
                
                let _values   = _l.split(',');
                let _rec      = {};
                columns.forEach((colName: string, colIndex: number) => {
                  if(isNotNull(_values[colIndex])) _rec[colName] = _values[colIndex];
                });
                // update ds stats
                _dataSources.set(_dsName, {
                  recordCount: _recordCount+1,
                  recordsWithRecordIdCount: _recordsWithRecId + (_rec['RECORD_ID'] ? 1 : 0)
                });
                // update top lvl stats
                topLevelStats.recordCount                 = topLevelStats.recordCount +1;
                topLevelStats.recordsWithDataSourceCount  = topLevelStats.recordsWithDataSourceCount + (_rec['DATA_SOURCE'] ? 1 : 0)
                topLevelStats.recordsWithRecordIdCount    = topLevelStats.recordsWithRecordIdCount + (_rec['RECORD_ID'] ? 1 : 0);
                
                // add json record
                linesAsJSON.push(_rec);
              });
    
              let analysisDataSources = [];
              _dataSources.forEach((value: {recordCount: number, recordsWithRecordIdCount: number}, key: string) => {
                let _existingDataSource = this.dataSourcesAsMap.has(key) ? this.dataSourcesAsMap.get(key) : undefined;
                let _analysisDs:SzImportedFilesAnalysisDataSource = {
                  name: key,
                  originalName: key,
                  recordCount: value.recordCount,
                  recordsWithRecordIdCount: value.recordsWithRecordIdCount,
                  exists: _existingDataSource ? true : false
                };
    
                if(_existingDataSource !== undefined) {
                  _analysisDs.id = _existingDataSource;
                }
                analysisDataSources.push(_analysisDs)
              })
    
              let fileAnalysis: SzImportedFileAnalysis = { 
                recordCount: topLevelStats.recordCount,
                recordsWithRecordIdCount: topLevelStats.recordsWithRecordIdCount,
                recordsWithDataSourceCount: topLevelStats.recordsWithDataSourceCount,
                records: linesAsJSON,
                dataSources: analysisDataSources
              }

              if(!_dataFiles.has(fileInfo.uploadName)) {
                fileInfo.analysis = fileAnalysis;
                _dataFiles.set(fileInfo.uploadName, fileInfo);
              } else {
                  let _fileInfo     = _dataFiles.get(fileInfo.uploadName);
                  fileInfo.analysis = fileAnalysis;
                  _dataFiles.set(fileInfo.uploadName, _fileInfo);
              }
              retVal.next(Array.from(_dataFiles, ([name, value]) => (value)));
    
    
              /*
              lines.forEach((_l, index) => {
                _dataSources.set(_l.split(',')[dsIndex], -1);
                let _values   = _l.split(',');
                let _rec      = {};
                columns.forEach((colName: string, colIndex: number) => {
                  if(isNotNull(_values[colIndex])) _rec[colName] = _values[colIndex];
                });
                linesAsJSON.push(_rec);
              });
              let _dataSourcesToAdd = [..._dataSources.keys()].filter((dsName) => {
                //console.log(`[${[...this.dataSourcesAsMap.keys()]}] includes "${dsName}"? ${this.dataSourcesAsMap.has(dsName)}`);
                return isNotNull(dsName) && !this.dataSourcesAsMap.has(dsName);
              });
    
              console.log(`parseFile: `, columns, [..._dataSources.keys()], _dataSourcesToAdd);
              if(_dataSourcesToAdd.length > 0) {
                this.configManagerService.config.then((conf)=>{
                  conf.addDataSources(_dataSourcesToAdd).pipe(
                    takeUntil(this.unsubscribe$)
                  ).subscribe((resp) => {
                    console.log(`added datasources: `, resp);
                    console.log(`conf: `, conf.definition);
                    this.configManagerService.setDefaultConfig(conf.definition).pipe(
                      takeUntil(this.unsubscribe$)
                    ).subscribe((newConfigId)=>{
                      console.log(`old config Id: #${_defaultConfigId}`);
                      console.log(`new config Id: #${newConfigId}`);
                      
                      this.SdkEnvironment.reinitialize(newConfigId);
                      this.configDefinition = conf.definition;
                      addJSONRecords(linesAsJSON);
                      //this.configManagerService.setDefaultConfig(conf.definition)
                    })
      
                    //addJSONRecords(linesAsJSON);
                  });
                })
                
              } else {
                addJSONRecords(linesAsJSON)
              }
              */
            }
          }
          console.log(`parseFile: "${_file.type}"`, isJSON, isCSV);
          // first get default id
          this.configManagerService.getDefaultConfigId().pipe(
            takeUntil(this.unsubscribe$)
          ).subscribe((configId)=>{
            _defaultConfigId = configId;
            console.log(`DEFAULT CONFIG ID: ${_defaultConfigId}`);
            // read file
            reader.readAsText(_file);
          });
        };
        return retVal.asObservable();
    }
}

/**
 * Count bytes in a string's UTF-8 representation.
 *
 * @param   string
 * @return  int
 */
export function getUtf8ByteLength(value: string): number {
    // Force string type
    value = String(value);

    let retValue: number = 0;
    for (var i = 0; i < value.length; i++) {
        var c = value.charCodeAt(i);
        retValue += (c & 0xf800) == 0xd800 ? 2 :  // Code point is half of a surrogate pair
                   c < (1 <<  7) ? 1 :
                   c < (1 << 11) ? 2 : 3;
    }
    return retValue;
}