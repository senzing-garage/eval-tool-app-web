import { Component, OnInit, ViewChild, Inject, AfterViewInit, HostBinding, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzGrpcConfig, SzGrpcConfigManagerService, SzSdkDataSource } from '@senzing/eval-tool-ui-common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SzDataFile, SzDataFileCardHighlightType, SzDataFileInfo, SzImportedFilesAnalysis } from '../../models/data-files';
import { SzDataFileComponent } from './data-file.component';
import { SzDataSourceCollectionComponent } from './data-source-collection/data-source-collection.component';
import { MatCardModule } from '@angular/material/card';
import { StorageService, LOCAL_STORAGE, SESSION_STORAGE } from 'ngx-webstorage-service';
import { detectLineEndings } from '../../common/import-utilities';
import { isNotNull } from '../../common/utils';

@Component({
    selector: 'data-files',
    templateUrl: './data-files.component.html',
    styleUrls: ['./data-files.component.scss'],
    imports: [
      CommonModule,
      MatCardModule,
      MatDialogModule, 
      MatTableModule, MatPaginatorModule, MatButtonModule, 
      MatIconModule, MatInputModule,
      SzDataSourceCollectionComponent
      //SzDataFileComponent
    ]
  })
  export class AppDataFilesComponent implements OnInit {
    private _loading: boolean = false;
    private _dataFilesData: SzDataFile[];
    private _dataSourcesData: {[key: string]: SzSdkDataSource};
    private _deleteDisabled: boolean = true;
    private _config: SzGrpcConfig; // config that the datasources/files belong to
    private _jsonTypes  = [
        'application/json',
        'application/ld+json'
    ];
    private _csvTypes   = [
        'text/csv'
    ]

    /** highlight the "add datasource" tile */
    @Input() highlightNewTile:boolean = true;
    /** highlight datasources by specific file names */
    @Input() highlightDataSourcesByFileName: string[];
    /** highlight children elements of the cards matching highlightDataSourcesByFileName */
    @Input() highlightedElements: SzDataFileCardHighlightType[];

    public get dataFiles() {
        return this._dataFilesData;
    }
    public get preparingNew(): boolean {
        return this._preparingNew;
    }
    public get files() : SzDataFile[] {
        return this._dataFilesData;
    }
    public get deleteDisabled() : boolean {
      return this._deleteDisabled;
    }

    @HostBinding('class.preparing-new')
    protected _preparingNew = false;
    @HostBinding('class.drag-over')
    protected _dragOver = false;


    constructor(
        //private adminBulkDataService: AdminBulkDataService,
        private datasourcesService: SzDataSourcesService,
        private configManagerService: SzGrpcConfigManagerService,
        private titleService: Title,
        public dialog: MatDialog,
        @Inject(LOCAL_STORAGE) private lStore: StorageService,
        @Inject(SESSION_STORAGE) private sStore: StorageService
    ) { }
    
    ngOnInit() {
        // set page title
        this.titleService.setTitle( 'Data Files' );
        this._loading = true;
        // first try and get the data files
        // if no data files, create super basic data files from data 
        // sources for basic card display
        this.configManagerService.config.then((config) => {
            this._config = config;
            this.getDataFiles().subscribe({
                next: this.onDataFilesResponse.bind(this),
                error: this.onNoDataFilesResponse.bind(this)
            })
        })
        
        //this.getDataSources(); // do first call
        //this.adminBulkDataService.onDataSourcesChange.subscribe(this.updateDataSourcesList.bind(this));
    }

    public onLoadDataSource(dataSource: SzDataFile) {
        console.log('onLoadDataSource: ', dataSource);
        if(dataSource && !dataSource.resolving) {
          //this.onResolveDataSources( [dataSource] );
        }
    }

    handleNewCardClick(event: Event = null) {
        //setTimeout(() => {
          this._preparingNew = !this._preparingNew;
        //});
    }
    handleNewFromDrive(event: Event|DragEvent) {
        console.log('handleNewFromDrive: ', event);
    
        const debug = false;
        const promises : Promise<SzDataFile>[] = [];
        const results: Observable<SzDataFile>[] = [];
        //const debugResults: Observable<SzDataFileInfo>[] = [];
        const uploadResults: Observable<SzDataFile>[] = [];
    
        const files : File[] = [];
        const existingFiles : string[] = [];
        const unsupportedFiles: string[] = [];
    
        const target: HTMLInputElement = <HTMLInputElement> event.target;
        const fileList = event["dataTransfer"] !== undefined
                      ? (<DragEvent>event).dataTransfer.files : target.files;
    
        let index = 0;
        for (index = 0; index < fileList.length; index++) {
          const file = fileList.item(index);
          files.push(file);
        }
    
        const getFileHandleFromDataFile = (dataFile: SzDataFile) => {
          return files.find( (_f: File) => {
            const path = _f["path"];
            const name = _f["name"];
            const retVal = (getNormalizedPath(path, name) === dataFile.url) ? true : false;
            return retVal;
            //return (SzDataFile.getName(name) === dataFile.url) ? true : false;
          });
        };
        const getNormalizedPath = (path: string, name?: string) => {
            // when local compare just "name" when electron use "path"
            if (path) {
              if (path.substring(1).startsWith(":\\") || path.startsWith("\\\\"))
              {
                path = path.replace(/\\/g, "/");
              }
              return (!path.startsWith("file://")) ? "file://" + path : path;
            } else if(name){
              // without a path just assume name is the path
              return name;
            }
            return undefined;
        };
        // now construct requests
        files.forEach(file => {
            let path = file["path"];
            const name = file["name"];
            const origPath = path;
    
            const fileInfo : SzDataFileInfo = {
                url: SzDataFile.getName(name),
                format: name.replace(/.*\.([^\.]+)/g, "$1"),
                name: SzDataFile.getName(name),
                totalSize: file.size,
                timestamp: new Date(file.lastModified)
            };
    
            if (path) {
                if (path.substring(1).startsWith(":\\") || path.startsWith("\\\\"))
                {
                    path = path.replace(/\\/g, "/");
                }
        
                fileInfo.url = "file://" + path;
                fileInfo.name = SzDataFile.getName(fileInfo.url);
                fileInfo.format = fileInfo.url.replace(/.*\.([^\.]+)/g, "$1");
            }
    
            if (this.files.findIndex(dataFile => dataFile.url === fileInfo.url) >= 0) {
                existingFiles.push(name);
                return;
            }
    
            const suffixStart = fileInfo.name.lastIndexOf(".");
            const fileSuffix = (suffixStart < 0) ? ""
            : fileInfo.name.substring(suffixStart).toLowerCase();
            switch (fileSuffix) {
            case '.csv':
            case '.json':
            case '.jsonl':
            case '.jsonlines':
                // do nothing
                break;
            default:
                unsupportedFiles.push(name);
                return;
            }
    
            console.log("UNSUPPORTED FILES: ", unsupportedFiles);
            // set up response listeners concat result
            if(debug) {
                // for debugging only, hands back file info obs at random delay
                const min = 5; const max = 10;
                const rand = (Math.floor(Math.random() * (max - min + 1) + min)) * 1000;
                //debugResults.push( of(fileInfo).pipe(delay(rand)) );
            } else {

                //const _dsCreated = this.projectService.createProjectFile(fileInfo, this.project.id);
                // add to results array
                //results.push( _dsCreated );
            }
        });
    }
    public onViewErrors(event: {dataSource: SzDataFile, errorChannel: string}) {
        console.log('onViewErrors: ', event);
        //this.serverErrors.show(event.errorChannel);
    }

    public onSelectionChanged(dataSources: SzDataFile[]) {
        console.log('onSelectionChanged: ', dataSources);
    }

    private onDataFilesResponse() {

    }
    private onNoDataFilesResponse() {
        // create data files from just datasources
        if(this._dataSourcesData) {

        } else {
            // get data sources
            this.getDataSources().subscribe({
                next: (dataSources) => {
                    let _dataFiles = this._createDataFilesFromDataSources(dataSources);
                    this._dataFilesData = _dataFiles;
                    console.log(`set datafiles from datasources: `, _dataFiles, this._dataFilesData);
                },
                error: () => {
                    
                }
            })
        }
    }
    
    public analyzeFiles(files: FileList): Observable<SzImportedFilesAnalysis> {
        let _fArr             = files;
        let _dataSources      = new Map<string, {recordCount: number, recordsWithRecordIdCount: number}>();
        let _defaultConfigId: number;
        let retVal            = new Subject<SzImportedFilesAnalysis>();
        let topLevelStats     = {
          recordCount: 0,
          recordsWithRecordIdCount: 0,
          recordsWithDataSourceCount: 0
        }
        console.log(`parseFile: `, event, _fArr);
        for(let i=0; i <= (_fArr.length - 1); i++) {
          let _file         = _fArr[i];
          let _fileContents = "";
          let isJSON    = this._jsonTypes.includes(_file.type);
          let isCSV     = this._csvTypes.includes(_file.type);
          if(!isJSON || isCSV) {
            // try and figure out if it's "text/plain" if it's actually 
            // a csv or json file masquerading as a plain text file
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
    
              let retAnalysis: SzImportedFilesAnalysis = { 
                recordCount: topLevelStats.recordCount,
                recordsWithRecordIdCount: topLevelStats.recordsWithRecordIdCount,
                recordsWithDataSourceCount: topLevelStats.recordsWithDataSourceCount,
                records: linesAsJSON,
                dataSources: analysisDataSources
              }
              
              retVal.next(retAnalysis)
    
    
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
    
    /** Removes Data Sources from current project.
    * Process is multi-staged. Will ask for purge or reload if
    * necessary, then ask user for delete confirmation.
    * On confirmation data sources are purged if necessary, then
    * deleted.
    */
    public onDeleteDataSources(dataSources: SzDataFile[]) {
        console.log('onDeleteDataSources: ', dataSources);
        // ------------------------- observeables      -------------------------
        let retVal: Observable<boolean[]>;
        const delReqs: Observable<boolean>[]              = [];
        const onPurgeOrReloadConfirmed: Subject<boolean>  = new Subject<boolean>();
        const onError: Subject<Error | string>            = new Subject<Error | string>();
    }

    public onReviewResults(dataSource: SzDataFile | string) {
        console.log('onReviewResults: ', dataSource);
        const dataSourceName      = ((dataSource as SzDataFile) && (dataSource as SzDataFile).dataSource) ? (dataSource as SzDataFile).dataSource : (dataSource as string);
        const dataSourceFileName  = ((dataSource as SzDataFile) && (dataSource as SzDataFile).name) ? (dataSource as SzDataFile).name : (dataSource as string);
    }

    private _createDataFilesFromDataSources(dataSources: SzSdkDataSource[]) {
        let retVal: SzDataFile[] = [];
        if(dataSources) {
            retVal = dataSources.map((ds) => {
                let _df: SzDataFile = {
                    id: ds.DSRC_ID,
                    name: ds.DSRC_CODE,
                    dataSource: ds,
                    configId: this.configManagerService.defaultConfigId,
                    reviewRequired: false,
                    resolved: true,
                    resolving: false
                }
                return _df;
            })
        }

        return retVal;
    }

    public getDataFiles() {
        let retSub = new Subject();
        let _dataFiles = new Map<string, SzDataFile>();
        if(this.lStore.has('dataFiles')) {
            let dataFiles = JSON.parse(this.lStore.get('dataFiles'));
            console.log(`datafiles from local storage: \n\r`, dataFiles);
        } else {
            retSub.error('data files only available from app context');
        }
        return retSub.asObservable();
    }

    public getDataSources(): Observable<SzSdkDataSource[]> {
        let retSub: Subject<SzSdkDataSource[]> = new Subject();
        this._loading = true;
        this.datasourcesService.getDataSources().subscribe( (data: SzSdkDataSource[]) => {
          let _data: {
            [id: string]: SzSdkDataSource;
          } = {};
          data.forEach((ds: SzSdkDataSource) => {
            _data[ds.DSRC_ID] = ds;
          });
          this._dataSourcesData = _data;
          this._loading = false;
          retSub.next(data);
        } );
        return retSub.asObservable();
    }

    private calculateDeleteDisabled() : boolean {
        /*
        if (!this.latestRecords) return false;
        if (this._preppingLoad) return true;
        if (this._resolving) return true;
        if (this._project) {
            if (this._project.resolving) return true;
            if (this._project.primingAudit) return true;
        }
    
        return this.fileCards.some(c => {
            switch (c.fileStatus) {
            case "uploading":
            case "processing":
            case "resolving":
            case "preparing-resolve":
                //console.warn('deleteDisabled(6): true "' + c.fileStatus + '"');
                return true;
            default:
                //console.log('deleteDisabled(7): false "' + c.fileStatus + '"');
                return false;
            }
        });
        */
       return false;
    }
    public openDataMappings(dataFile: SzDataFile) {
        //this.animateState = 'slideLeft';
        /*const targetURL = 'projects/' + this.project.id + '/files/'
                    + dataFile.id + '/mappings';
        setTimeout(() => {
          this.router.navigate([targetURL]);
        }, 0);*/
    }
  }