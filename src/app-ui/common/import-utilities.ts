import { filter, map, Observable, ReplaySubject, Subject, take, takeUntil } from "rxjs";
import { SzDataFile, SzDataFileInfo, SzFileValidationResult, SzImportedDataFile, SzImportedFileAnalysis, SzImportedFilesAnalysisDataSource } from "../models/data-files";
import { isNotNull, detectLineEndings } from "./utils";
import { SzGrpcConfig, SzGrpcConfigManagerService, SzGrpcEngineService, SzGrpcProductService, SzSdkConfigDataSource, SzSdkConfigJson, SzSdkDataSource } from "@senzing/eval-tool-ui-common";
import { ElementRef, Inject } from "@angular/core";
import { SzError, SzGrpcWebEnvironment } from "@senzing/sz-sdk-typescript-grpc-web";
import languageEncoding from "detect-file-encoding-and-language";

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

export { detectLineEndings } from "./utils";

/** Split a CSV line respecting quoted fields (RFC 4180). */
function splitCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                fields.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    fields.push(current);
    return fields;
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

/**
 * Recognized Senzing entity specification attribute names.
 * A record must have at least one of these to be useful for entity resolution.
 */
const SENZING_FEATURE_ATTRIBUTES = new Set([
  // Name
  'NAME_FIRST', 'NAME_LAST', 'NAME_MIDDLE', 'NAME_PREFIX', 'NAME_SUFFIX',
  'NAME_FULL', 'NAME_ORG', 'NAME_TYPE',
  // Address
  'ADDR_LINE1', 'ADDR_LINE2', 'ADDR_LINE3', 'ADDR_LINE4', 'ADDR_LINE5', 'ADDR_LINE6',
  'ADDR_CITY', 'ADDR_STATE', 'ADDR_POSTAL_CODE', 'ADDR_COUNTRY', 'ADDR_FULL', 'ADDR_TYPE',
  // Phone / Email / Website
  'PHONE_NUMBER', 'PHONE_TYPE', 'EMAIL_ADDRESS', 'WEBSITE_ADDRESS',
  // Dates & Demographics
  'DATE_OF_BIRTH', 'DATE_OF_DEATH', 'GENDER', 'NATIONALITY', 'CITIZENSHIP',
  'PLACE_OF_BIRTH', 'REGISTRATION_DATE', 'REGISTRATION_COUNTRY', 'RECORD_TYPE',
  // Identifiers
  'SSN_NUMBER', 'PASSPORT_NUMBER', 'PASSPORT_COUNTRY',
  'DRIVERS_LICENSE_NUMBER', 'DRIVERS_LICENSE_STATE',
  'NATIONAL_ID_NUMBER', 'NATIONAL_ID_TYPE', 'NATIONAL_ID_COUNTRY',
  'TAX_ID_NUMBER', 'TAX_ID_TYPE', 'TAX_ID_COUNTRY',
  'OTHER_ID_NUMBER', 'OTHER_ID_TYPE', 'OTHER_ID_COUNTRY',
  'ACCOUNT_NUMBER', 'ACCOUNT_DOMAIN',
  'DUNS_NUMBER', 'NPI_NUMBER', 'LEI_NUMBER', 'CC_ACCOUNT_NUMBER',
  // Social
  'SOCIAL_HANDLE', 'SOCIAL_NETWORK',
  'LINKEDIN', 'FACEBOOK', 'TWITTER', 'SKYPE', 'INSTAGRAM',
  'WHATSAPP', 'SIGNAL', 'TELEGRAM', 'TANGO', 'VIBER', 'WECHAT', 'ZOOMROOM',
  // Group / Employment
  'EMPLOYER', 'GROUP_ASSOCIATION_TYPE', 'GROUP_ASSOCIATION_ORG_NAME',
  'GROUP_ASSN_ID_TYPE', 'GROUP_ASSN_ID_NUMBER',
  // Relationships
  'REL_ANCHOR_DOMAIN', 'REL_ANCHOR_KEY', 'REL_POINTER_DOMAIN', 'REL_POINTER_KEY', 'REL_POINTER_ROLE',
  // Trusted ID
  'TRUSTED_ID_TYPE', 'TRUSTED_ID_NUMBER'
]);

/**
 * Validate records against the Senzing entity specification.
 * Checks that records have DATA_SOURCE, RECORD_ID, and at least one matchable feature.
 */
export function validateSenzingRecords(records: {[key: string]: any}[]): SzFileValidationResult {
  let missingDataSource = 0;
  let missingRecordId = 0;
  let missingFeatures = 0;
  const featuresFound = new Set<string>();

  for (const rec of records) {
    if (!rec['DATA_SOURCE']) missingDataSource++;
    if (!rec['RECORD_ID']) missingRecordId++;

    let hasFeature = false;
    for (const key of Object.keys(rec)) {
      if (SENZING_FEATURE_ATTRIBUTES.has(key.toUpperCase())) {
        featuresFound.add(key.toUpperCase());
        hasFeature = true;
      }
    }
    if (!hasFeature) missingFeatures++;
  }

  const allHaveDS = missingDataSource === 0;
  const allHaveID = missingRecordId === 0;
  const recordCount = records.length;

  return {
    valid: allHaveDS && (recordCount - missingFeatures) > 0,
    allRecordsHaveDataSource: allHaveDS,
    allRecordsHaveRecordId: allHaveID,
    recordsWithFeatureCount: recordCount - missingFeatures,
    recordsMissingDataSourceCount: missingDataSource,
    recordsMissingRecordIdCount: missingRecordId,
    recordsMissingFeaturesCount: missingFeatures,
    featuresFound: [...featuresFound]
  };
}

export interface SzFileImportHelperOptions {
  excludeDataSources?: string[],
  defaultUploadNameSameAsFile?: boolean
}

export class SzFileImportHelper {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$   = new Subject<void>();
  private _dataSources: SzSdkDataSource[];
  public defaultConfigId: number;
  public configDefinition: string;
  public isInProgress = false;
  private _results;
  public dataFiles: SzImportedDataFile[];
  //public dataSourcesToRemap = new Map<string, string>;
  public results;
  public currentError: Error;
  private _onException  = new Subject<SzError>();
  public onException    = this._onException.asObservable();

  private uploadedNamesSameAsFileByDefault = false;
  private dataSourcesToExclude = [];
  
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
  /*public get displayedColumns(): string[] {
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
  }*/
  public get dataSources() {
      let retVal = this._dataSources;
      return retVal;
  }
  /** Normalize datasource key for case-insensitive comparison */
  private normalizeDataSourceKey(key: string): string {
      return key && key.toUpperCase ? key.toUpperCase() : '';
  }
  private get dataSourcesAsMap() : Map<string, number> {
      let retVal = new Map<string, number>();
      this._dataSources?.forEach((dsItem) => {
        retVal.set(this.normalizeDataSourceKey(dsItem.DSRC_CODE), dsItem.DSRC_ID);
      })
      return retVal;
  }
  /*public get dataCanBeLoaded(): boolean {
      let retVal = !this.isInProgress && (this.dataFiles ? true : false);
      if(this.hasBlankDataSource) {
        retVal = retVal && this.dataSourcesToRemap.has('NONE');
      }
      return retVal;
  }*/
  
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
      private configManagerService: SzGrpcConfigManagerService,
      private options?: SzFileImportHelperOptions
  ) {
    if(options) {
      if(options.defaultUploadNameSameAsFile) this.uploadedNamesSameAsFileByDefault = options.defaultUploadNameSameAsFile;
      if(options.excludeDataSources) this.dataSourcesToExclude = options.excludeDataSources;
    }

    // populate list of datasources from config
    this.getDataSources().pipe(
      takeUntil(this.unsubscribe$),
      take(1),
      map((ds: SzSdkDataSource[]) => {
        if(this.dataSourcesToExclude !== undefined) {
          return ds.filter((_ds) => {
            return this.dataSourcesToExclude.indexOf(_ds.DSRC_CODE) < 0;
          });
        }
        return ds;
      })
    ).subscribe((dataSources)=>{
      this._dataSources = dataSources;
      console.log(`got datasources: `, this._dataSources);
    });
    // get default config id
    this.configManagerService.getDefaultConfigId().pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((configId)=>{
      this.defaultConfigId = configId;
      console.log(`DEFAULT CONFIG ID: ${this.defaultConfigId}`);
    });
    this.configManagerService.config.then((config)=>{
      this.configDefinition = config.definition;
    });
  }
  public getIsNew(value: boolean): boolean | undefined {
    return (value === true) ? value : false;
  }
  public isNewDataSource(value: string): boolean {
    //return true;
    return value && (value.trim().length > 0) && !(this.dataSourcesAsMap.has(this.normalizeDataSourceKey(value)));
  }
  public isMappedNewDataSource(originalName: string, unassignedMapping: string): boolean {
    // if we have an originalName on a record check that
    // if not check the mapping value for "undefined/NONE"
    return originalName && (originalName.trim().length > 0) ? !this.dataSourcesAsMap.has(this.normalizeDataSourceKey(originalName)) : !this.dataSourcesAsMap.has(this.normalizeDataSourceKey(unassignedMapping));
    //return !this.dataSourcesAsMap.has(nameToLookFor);
    //return originalName && (originalName.trim().length > 0) && !(this.dataSourcesAsMap.has(originalName));
  }
  public isBlankDataSource(originalName: string): boolean {
    return originalName && isNotNull(originalName) ? true : false;
  }

  public updateRecordDataSources(records, dataSources: SzImportedFilesAnalysisDataSource[]) {
    let retVal = records;
    let undefinedDataSourceCode = undefined;
    let DSRC_CODE_BY_ORIGIN_MAP = new Map<string, SzImportedFilesAnalysisDataSource>();
    if(dataSources && dataSources.forEach) {
      dataSources.forEach((_dataSource) => {
        DSRC_CODE_BY_ORIGIN_MAP.set(_dataSource.DSRC_ORIGIN === undefined ? 'NONE' : _dataSource.DSRC_ORIGIN, _dataSource);
      });
    }
    if(records && records.map) {
      let remappedRecords = records.map((rec) => {
        let _rec = Object.assign({}, rec, {
          DATA_SOURCE: (!rec['DATA_SOURCE'] || !isNotNull(rec['DATA_SOURCE']))
            ? (DSRC_CODE_BY_ORIGIN_MAP.has('NONE') ? DSRC_CODE_BY_ORIGIN_MAP.get('NONE').DSRC_CODE : rec['DATA_SOURCE'])
            : (DSRC_CODE_BY_ORIGIN_MAP.has(rec['DATA_SOURCE']) ? DSRC_CODE_BY_ORIGIN_MAP.get(rec['DATA_SOURCE']).DSRC_CODE : rec['DATA_SOURCE'])
        });
        return _rec;
      });
      retVal = remappedRecords;
    }
    return retVal;
  }

  public registerDataSources(dataSources: SzImportedFilesAnalysisDataSource[]) {
    let retVal = new ReplaySubject<SzSdkConfigDataSource[]>(1);
    let _dataSourcesToAdd = dataSources.filter((dsItem) => {
      return !(dsItem.EXISTS && isNotNull(dsItem.EXISTS));
    }).map((dsItem) => {
      return dsItem.DSRC_CODE;
    });
    console.log(`registerDataSources: `, dataSources, _dataSourcesToAdd);

    if(_dataSourcesToAdd.length > 0) {
      this.configManagerService.config.then((conf)=>{
        console.log(`registerDataSources: `, dataSources);
        conf.registerDataSources(_dataSourcesToAdd).pipe(
          takeUntil(this.unsubscribe$)
        ).subscribe((resp) => {
          console.log(`added datasources: `, resp);
          console.log(`conf: `, conf.definition);
          this.configManagerService.setDefaultConfig(conf.definition).pipe(
            takeUntil(this.unsubscribe$)
          ).subscribe((newConfigId)=>{
            console.log(`new config Id: #${newConfigId}`);
            this.SdkEnvironment.reinitialize(newConfigId);
            this.engineService.reinitialize(newConfigId)
            //this.SdkEnvironment.engine.reinitialize(newConfigId);
            this.defaultConfigId    = newConfigId;
            this.configDefinition   = conf.definition;
            let dataSourcesFromConfig = this.getDataSourcesFromConfigDef(conf.definition);

            dataSourcesFromConfig.forEach((dsOutput)=> {
              let dsInput = dataSources.find((_dsInput)=>{
                return (dsOutput.DSRC_CODE.toUpperCase() === _dsInput.DSRC_CODE.toUpperCase())
              });
              if(dsInput) {
                // overwrite local values with values from config object
                dsInput =  Object.assign(dsInput, dsOutput, {name: dsOutput.DSRC_CODE, EXISTS: dsOutput.DSRC_ID !== undefined});
              }
            });
            // return updated list of datasources from in memory config
            retVal.next(dataSourcesFromConfig);
          });
        });
      })
    } else {
      // All data sources already exist, nothing to register
      retVal.next([]);
    }
    return retVal.asObservable();
  }
  private getDataSourcesFromConfigDef(config: string) {
    let grpcConf = JSON.parse(config) as SzSdkConfigJson;
    if(grpcConf.G2_CONFIG && grpcConf.G2_CONFIG.CFG_DSRC) {
      return grpcConf.G2_CONFIG.CFG_DSRC;
    }
    return undefined;
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
    ).subscribe({
      next: (result)=> {
        retVal.next(result);
      },
      error: (error)=>{
        this._onException.next(error)
      }
    });
    return retVal.asObservable();
  }

  /*public ifNotEmpty(value: any) {
      let retVal = isNotNull(value) ? value : '';
      return retVal;
  }*/

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

    // Shared function to process parsed records and calculate stats
    const processRecords = (linesAsJSON: any[], fileInfo: SzImportedDataFile) => {
      // Per-file tracking - each file should be analyzed independently
      _dataSources.clear();
      const topLevelStats = {
        recordCount: 0,
        recordsWithRecordIdCount: 0,
        recordsWithDataSourceCount: 0,
        recordsWithEntityTypeCount: 0
      };

      // Process records and calculate stats
      linesAsJSON.forEach((_rec) => {
        let _dsName = _rec['DATA_SOURCE'];
        let _existingDataSource = _dataSources.has(_dsName) ? _dataSources.get(_dsName) : undefined;
        let _recordCount = _existingDataSource ? _existingDataSource.recordCount : 0;
        let _recordsWithRecId = _existingDataSource ? _existingDataSource.recordsWithRecordIdCount : 0;

        // update ds stats
        _dataSources.set(_dsName, {
          recordCount: _recordCount + 1,
          recordsWithRecordIdCount: _recordsWithRecId + (_rec['RECORD_ID'] ? 1 : 0)
        });
        // update top lvl stats
        topLevelStats.recordCount = topLevelStats.recordCount + 1;
        topLevelStats.recordsWithDataSourceCount = topLevelStats.recordsWithDataSourceCount + (_rec['DATA_SOURCE'] ? 1 : 0);
        topLevelStats.recordsWithRecordIdCount = topLevelStats.recordsWithRecordIdCount + (_rec['RECORD_ID'] ? 1 : 0);
      });

      let analysisDataSources: SzImportedFilesAnalysisDataSource[] = [];
      _dataSources.forEach((value: {recordCount: number, recordsWithRecordIdCount: number}, key: string) => {
        let _normalizedKey = this.normalizeDataSourceKey(key);
        let _existingDataSource = this.dataSourcesAsMap.has(_normalizedKey) ? this.dataSourcesAsMap.get(_normalizedKey) : undefined;
        let _analysisDs: SzImportedFilesAnalysisDataSource = {
          DSRC_CODE: key,
          DSRC_ORIGIN: key,
          RECORD_COUNT: value.recordCount,
          RECORD_WITH_ID_COUNT: value.recordsWithRecordIdCount,
          EXISTS: _existingDataSource ? true : false
        };

        if(_existingDataSource !== undefined) {
          _analysisDs.DSRC_ID = _existingDataSource;
        }
        analysisDataSources.push(_analysisDs);
      });

      const validation = validateSenzingRecords(linesAsJSON);

      let fileAnalysis: SzImportedFileAnalysis = {
        recordCount: topLevelStats.recordCount,
        recordsWithRecordIdCount: topLevelStats.recordsWithRecordIdCount,
        recordsWithDataSourceCount: topLevelStats.recordsWithDataSourceCount,
        recordsWithEntityTypeCount: topLevelStats.recordsWithEntityTypeCount,
        records: linesAsJSON,
        dataSources: analysisDataSources,
        validation
      };

      fileInfo.analysis = fileAnalysis;
      fileInfo.recordCount = fileAnalysis.recordCount;
      if (!validation.allRecordsHaveDataSource) {
        // Records missing DATA_SOURCE require mapping review
        fileInfo.reviewRequired = true;
        fileInfo.mappingComplete = false;
        console.log(`file requires mapping: ${validation.recordsMissingDataSourceCount}/${topLevelStats.recordCount} records missing DATA_SOURCE`);
      } else if (!validation.valid) {
        // All records have DATA_SOURCE but no matchable features found
        fileInfo.reviewRequired = true;
        fileInfo.mappingComplete = false;
        console.warn(`file has DATA_SOURCE on all records but no recognized Senzing features`);
      } else {
        // All records have DATA_SOURCE and at least some have matchable features
        fileInfo.mappingLearned = true;
        console.log(`file is pre-mapped (${fileAnalysis.dataSources.length} datasource(s), features: ${validation.featuresFound.join(', ')})`);
      }

      // Propagate analysis datasources to card-level for display
      fileInfo.dataSources = analysisDataSources;

      // Default the card name based on datasource count
      if (!fileInfo.name && fileAnalysis.dataSources.length > 0) {
        if (fileAnalysis.dataSources.length === 1 && fileAnalysis.dataSources[0].DSRC_CODE) {
          // Single datasource: use the datasource name
          fileInfo.name = fileAnalysis.dataSources[0].DSRC_CODE.toUpperCase().replace(/[\s-]+/g, '_');
        } else if (fileAnalysis.dataSources.length > 1) {
          // Multiple datasources: use the filename without extension
          const baseName = (fileInfo.uploadName || '').replace(/\.[^.]+$/, '');
          fileInfo.name = baseName.toUpperCase().replace(/[\s-]+/g, '_');
        }
      }
      _dataFiles.set(fileInfo.uploadName, fileInfo);
      retVal.next(Array.from(_dataFiles, ([name, value]) => (value)));
    };

    console.log(`parseFile: `, _fArr);
      
    for(let i=0; i <= (_fArr.length - 1); i++) {
      let _file       = _fArr[i];
      let path        = _file["path"];
      const name      = _file["name"];
      const origPath  = path;
      let _fileContents = "";
      const fileTypeFromName = getFileTypeFromName(_file);
      let isJSON      = this._jsonTypes.includes(_file.type) ||
                        fileTypeFromName === validImportFileTypes.JSON ||
                        fileTypeFromName === validImportFileTypes.JSONL;
      let isCSV       = this._csvTypes.includes(_file.type) ||
                        fileTypeFromName === validImportFileTypes.CSV;

      const fileInfo : SzImportedDataFile = {
        url: SzFileImportHelper.getFileName(name),
        format: name.replace(/.*\.([^\.]+)/g, "$1"),
        /*name: importHelper.getFileName(name),*/ // by default don't name incoming files
        mediaType: isJSON ? 'JSON' : isCSV ? 'Comma Separated Values' : 'Unknown',
        uploadName: SzFileImportHelper.getFileName(name),
        size: _file.size,
        timestamp: new Date(_file.lastModified),
        mappingComplete: true,
        reviewRequired: false,
        //status?: string;
        supportsDeletion: true,
        supportsMapping: true,
        supportsRenaming: true
      };
      languageEncoding(_file).then((fileEncodingResponse) => {
        if(fileEncodingResponse.confidence && fileEncodingResponse.confidence.encoding > 0.7) {
          fileInfo.characterEncoding = fileEncodingResponse.encoding;
        }
      }).catch(() => {
        // Encoding detection can fail for drag-and-drop files; non-critical
      });

      if (path) {
        if (path.substring(1).startsWith(":\\") || path.startsWith("\\\\"))
        {
            path = path.replace(/\\/g, "/");
        }
        fileInfo.url        = "file://" + path;
        /*fileInfo.name       = SzDataFile.getName(fileInfo.url);*/ // by default don't name incoming files
        fileInfo.uploadName = SzDataFile.getName(fileInfo.url);
        fileInfo.format     = fileInfo.url.replace(/.*\.([^\.]+)/g, "$1");
      }
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
          console.warn(`unexpected line ending style: "${lineEndingStyle}"`, lineEndingStyle);
          return;
        }
        //console.log(`parseFile: on read end.`, lineEndingStyle, lines);

        if(isJSON) {
          let linesAsJSON = [];

          // Parse JSON or JSONL based on file extension
          if(fileTypeFromName === validImportFileTypes.JSONL) {
            // JSONL: each line is a separate JSON object
            lines.filter((_l) => _l && _l.trim() !== '').forEach((_l) => {
              try {
                const record = JSON.parse(_l);
                linesAsJSON.push(record);
              } catch(e) {
                console.warn(`Failed to parse JSONL line: ${_l}`, e);
              }
            });
          } else {
            // JSON: parse entire content as JSON array or single object
            try {
              const parsed = JSON.parse(_fileContents);
              if(Array.isArray(parsed)) {
                linesAsJSON = parsed;
              } else {
                linesAsJSON = [parsed];
              }
            } catch(e) {
              console.warn(`Failed to parse JSON file: ${fileInfo.uploadName}`, e);
            }
          }

          processRecords(linesAsJSON, fileInfo);

        } else if(isCSV) {
          // get column headers indexes
          let columns     = splitCsvLine(lines.shift());
          let linesAsJSON = [];

          // Parse CSV lines into JSON objects
          lines.filter((_l) => isNotNull(_l)).forEach((_l) => {
            let _values = splitCsvLine(_l);
            let _rec = {};
            columns.forEach((colName: string, colIndex: number) => {
              if(isNotNull(_values[colIndex])) _rec[colName] = _values[colIndex];
            });
            linesAsJSON.push(_rec);
          });

          processRecords(linesAsJSON, fileInfo);


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
            return isNotNull(dsName) && !this.dataSourcesAsMap.has(this.normalizeDataSourceKey(dsName));
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
      // fetch config id in parallel (used by legacy code paths)
      this.configManagerService.getDefaultConfigId().pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((configId)=>{
        _defaultConfigId = configId;
        console.log(`DEFAULT CONFIG ID: ${_defaultConfigId}`);
      });
      // read file immediately — drag-and-drop File refs can become
      // unreadable if the read starts after an async gap
      reader.readAsText(_file);
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
