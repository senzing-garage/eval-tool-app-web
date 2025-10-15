import { Component, OnInit, ViewChild, Inject, AfterViewInit, HostBinding, Input, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzGrpcConfig, SzGrpcConfigManagerService, SzGrpcEngineService, SzGrpcProductService, SzSdkConfigDataSource, SzSdkConfigJson, SzSdkDataSource } from '@senzing/eval-tool-ui-common';
import { Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SzDataFile, SzImportedDataFile, SzDataFileCardHighlightType, SzDataFileInfo, SzImportedFileAnalysis } from '../../models/data-files';
import { SzDataSourceCollectionComponent } from './data-source-collection/data-source-collection.component';
import { MatCardModule } from '@angular/material/card';
import { StorageService, LOCAL_STORAGE, SESSION_STORAGE } from 'ngx-webstorage-service';
import { detectLineEndings, SzFileImportHelper } from '../../common/import-utilities';
import { isNotNull } from '../../common/utils';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { SzDialogService } from '../../dialogs/common-dialog/common-dialog.service';
import { SzDataFileDataSourceMappingsDialog } from '../mapping/file-data-source-mappings.component';

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
    ],
    providers: [SzDialogService]
  })
  export class AppDataFilesComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _loading: boolean = false;
    private _dataFilesData: SzDataFile[];
    private _uploadedFiles: SzImportedDataFile[];
    private _dataSourcesData: {[key: string]: SzSdkDataSource};
    private _deleteDisabled: boolean = false;
    private _config: SzGrpcConfig; // config that the datasources/files belong to
    private _jsonTypes  = [
        'application/json',
        'application/ld+json'
    ];
    private _csvTypes   = [
        'text/csv'
    ];

    private excludedDataSources: string[] = [
        'TEST',
        'SEARCH'
    ];

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
    public get uploadedFiles(): SzImportedDataFile[] {
        return this._uploadedFiles;
    }
    public get deleteDisabled() : boolean {
      return this._deleteDisabled;
    }

    @HostBinding('class.preparing-new')
    protected _preparingNew = false;
    @HostBinding('class.drag-over')
    protected _dragOver = false;


    constructor(
        @Inject('GRPC_ENVIRONMENT') private SdkEnvironment: SzGrpcWebEnvironment,
        private productService: SzGrpcProductService,
        private engineService: SzGrpcEngineService,
        //private adminBulkDataService: AdminBulkDataService,
        private datasourcesService: SzDataSourcesService,
        private configManagerService: SzGrpcConfigManagerService,
        private titleService: Title,
        public dialog: MatDialog,
        private dialogService: SzDialogService,
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

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public onLoadDataSource(dataSource: SzDataFile) {
        console.log('onLoadDataSource: ', dataSource);
        if(dataSource && !dataSource.resolving) {
            //this.onResolveDataSources( [dataSource] );
            // first create any datasources we are missing and update the configId
          
            const fileImport = new SzFileImportHelper(
                this.SdkEnvironment,
                this.productService,
                this.engineService,
                this.configManagerService
            );
            //import
            // update data
            let uploadRef = this._uploadedFiles.find((df) => {
                return df.uploadName === dataSource.uploadName;
            });
            console.log('\tupload ref:', uploadRef);
            let dataSourcesRegistered       = new Subject<SzSdkConfigDataSource[]>();

            if(uploadRef) {
                uploadRef.status            = 'registering';
                uploadRef.registering       = true;
                uploadRef.processing        = true;
                //uploadRef.resolving    =  true;
                dataSourcesRegistered.subscribe((dataSources)=>{
                    // load records
                    uploadRef.status                = 'processing';
                    uploadRef.processing            = true;
                    uploadRef.processedRecordCount  = 0;
                    let updatedRecords              = fileImport.updateRecordDataSources(uploadRef.analysis.records, uploadRef.analysis.dataSources);
                    console.log(`\trecords with remapped sources: `, updatedRecords);
                    fileImport.addRecords(updatedRecords).pipe(
                        takeUntil(this.unsubscribe$)
                    ).subscribe((resp)=> {
                        console.log('added records: ', resp);
                        uploadRef.processedRecordCount  = resp && resp.length > 0 ? resp.length : 0;
                        uploadRef.processing        = false;
                        //this.results = resp;
                    });
                });

                fileImport.registerDataSources(uploadRef.dataSources).
                subscribe({
                    next: (result) => {
                        console.log(`created new datasources: `, result, uploadRef);
                        uploadRef.status            = 'registered';
                        uploadRef.registering       = false;
                        uploadRef.supportsDeletion  = false;
                        //let conf = JSON.parse(fileImport.configDefinition) as SzSdkConfigJson;
                        dataSourcesRegistered.next(result);
                    },
                    error: (error) => {
                        console.error(error);
                    }
                })
            }
        }
    }

    handleNewCardClick(event: Event = null) {
        //setTimeout(() => {
          this._preparingNew = !this._preparingNew;
        //});
    }
    onFileInputChange(event: Event|DragEvent) {
        console.log('onFileInputChange: ', event);

        const files : File[]                = [];
        const existingFiles : string[]      = [];
        const unsupportedFiles: string[]    = [];
        const fileImport = new SzFileImportHelper(
            this.SdkEnvironment,
            this.productService,
            this.engineService,
            this.configManagerService
        );
    
        const target: HTMLInputElement = <HTMLInputElement> event.target;
        const fileList = event["dataTransfer"] !== undefined
                      ? (<DragEvent>event).dataTransfer.files : target.files;
    

        let index = 0;
        for (index = 0; index < fileList.length; index++) {
          const file = fileList.item(index);
          files.push(file);
        }
        let filesToImport = fileImport.analyzeFiles(files)
        filesToImport.subscribe((files: SzImportedDataFile[])=>{

            // add dataSource Cards to collection with "Load" and "Rename" Buttons
            
            /*let importingDataSources = files.dataSources.map((ds) => {
                let _df: SzDataFile = {
                    name: ds.name,
                    reviewRequired: false,
                    resolved: false,
                    resolving: false,
                    fileAnalysis: ds,
                    records: analysis.records.filter((record)=>{
                        return record['DATA_SOURCE'] == ds.originalName;
                    })
                }
                return _df;
            })*/
            let unProcessedFiles    = this._uploadedFiles ? this._uploadedFiles : []
            files.forEach((file)=>{
                let existingFilePos = unProcessedFiles.findIndex((uploadedFile) => {
                    return uploadedFile.uploadName === file.uploadName;
                })
                if(existingFilePos >= 0) {
                    unProcessedFiles[existingFilePos] = file;
                } else {
                    unProcessedFiles.push(file);
                }
            })
            this._uploadedFiles     = unProcessedFiles;
            console.log('onFileInputChange: Analysis', files, unProcessedFiles);

        });

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

    public onSelectionChanged(dataSources: Array<SzImportedDataFile | SzDataFile>) {
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
    
    /** Removes Data Sources from current project.
    * Process is multi-staged. Will ask for purge or reload if
    * necessary, then ask user for delete confirmation.
    * On confirmation data sources are purged if necessary, then
    * deleted.
    */
    public onDeleteDataSources(dataSourcesToDelete: Array<SzDataFile | SzImportedDataFile>) {
        console.log('onDeleteDataSources: ', dataSourcesToDelete);
        // ------------------------- observeables      -------------------------
        let retVal: Observable<boolean[]>;
        const delReqs: Observable<boolean>[]                = [];
        const onPurgeOrReloadConfirmed: Subject<boolean>    = new Subject<boolean>();
        const onError: Subject<Error | string>              = new Subject<Error | string>();
        let registeredDataSources   = [];
        let pendingDataSources      = this._uploadedFiles;
        let onDeleteRegisteredDataSources                   = new Subject<SzDataFile[]>();
        let onDeleteUnRegisteredDataSources                 = new Subject<SzImportedDataFile[]>();


        onDeleteRegisteredDataSources.asObservable().pipe(
            takeUntil(this.unsubscribe$),
            take(1)
        ).subscribe((targetedDataSources)=> {
            let targetedDataSourceCodes = targetedDataSources.map((targetedDs) => {
                return targetedDs.name;
            });
            let targetedDataSourceIds = targetedDataSources.map((targetedDs) => {
                return targetedDs.id;
            });
            this.datasourcesService.unregisterDataSources(targetedDataSourceCodes).subscribe((resp)=>{
                console.log(`unregistered ${targetedDataSourceCodes.join(', ')} data sources`, resp);
                // remove card
                let _removedCodes = resp.filter((_deleteDsResp) => { 
                    return _deleteDsResp.DELETED;
                }).map((_deletedDs)=>{
                    return _deletedDs.DSRC_CODE;
                })
                let _scrubbedList: {[key: string]: SzSdkDataSource} = {};
                for(let DSRC_ID in this._dataSourcesData) {
                    if(_removedCodes.indexOf(this._dataSourcesData[DSRC_ID].DSRC_CODE) < 0){
                        _scrubbedList[DSRC_ID] = this._dataSourcesData[DSRC_ID];
                    }
                };
                this._dataSourcesData   = _scrubbedList;
                let _dataSourcesAsArray = [];
                for(let DSRC_ID in this._dataSourcesData) {
                    _dataSourcesAsArray.push(this._dataSourcesData[DSRC_ID]);
                }
                let _dataFiles = this._createDataFilesFromDataSources(_dataSourcesAsArray);
                this._dataFilesData = _dataFiles;
                console.log(`\t new list`, _scrubbedList, _removedCodes);
            })
        });

        this.getDataSources().subscribe({
            next: (dataSources) => {
                registeredDataSources = this._createDataFilesFromDataSources(dataSources);

                if(dataSourcesToDelete && dataSourcesToDelete.forEach) {
                    /** do datafiles that have not yet had datasources persisted to config */
                    let importedDataSources = dataSourcesToDelete.filter((_dstd) => {
                        return !((_dstd as SzDataFile).resolved) && (_dstd as SzImportedDataFile).supportsDeletion;
                    }).map((_dstd)=> {
                        return (_dstd as SzImportedDataFile)
                    });
                    let importedSourceUploadNames = importedDataSources.map((importedSource)=> {
                        return importedSource.uploadName;
                    });
                    console.log(`\t importedDataSources: ${importedSourceUploadNames.join(',')}`, importedDataSources);
                    if(importedDataSources && importedDataSources.length > 0) {
                        let _scrubbedImportList = this._uploadedFiles.filter((importedFile) => {
                            return importedSourceUploadNames.indexOf( importedFile.uploadName ) < 0;
                        });
                        this._uploadedFiles = _scrubbedImportList;
                    }
                    /** do data sources that have already been persisted (requires purge) */
                    let persistedDataSources    = dataSourcesToDelete.filter((_dstd)=> {
                        return ((_dstd as SzDataFile).id) && (_dstd as SzImportedDataFile).supportsDeletion;
                    }).map((_dstd)=> {
                        return (_dstd as SzDataFile)
                    });
                    let persistedSourceCodes = persistedDataSources.map((dataSource)=> {
                        return dataSource.name;
                    });
                    console.log(`\t persistedDataSources: ${persistedSourceCodes.join(',')}`, persistedDataSources);
                    onDeleteRegisteredDataSources.next(persistedDataSources);
                }
            },
            error: () => {
                
            }
        });
    }

    public onReviewResults(dataSource: SzDataFile | SzImportedDataFile | string) {
        console.log('onReviewResults: ', dataSource);
        this.dialogService.alert('Work on this feature is still in progress. When the feature is complete this link will be enabled.', 'Not Yet Implemented')

        //const dataSourceName      = ((dataSource as SzDataFile) && (dataSource as SzDataFile).dataSource) ? (dataSource as SzDataFile).dataSource : (dataSource as string);
        //const dataSourceFileName  = ((dataSource as SzDataFile) && (dataSource as SzDataFile).name) ? (dataSource as SzDataFile).name : (dataSource as string);
    }

    private _createDataFilesFromDataSources(dataSources: SzSdkDataSource[]) {
        let retVal: SzDataFile[] = [];
        if(dataSources) {
            retVal = dataSources.map((ds) => {
                let _df: SzDataFile = {
                    id: ds.DSRC_ID,
                    name: ds.DSRC_CODE,
                    dataSources: [ds],
                    configId: this.configManagerService.defaultConfigId,
                    reviewRequired: false,
                    resolved: true,
                    resolving: false,
                    supportsDeletion: !this.deleteDisabled
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
        this.datasourcesService.getDataSources().pipe(
            /** filter out any unwanted datasources */
            map((dataSources: SzSdkDataSource[]) => {
                return dataSources.filter((ds)=>{
                    return this.excludedDataSources.indexOf(ds.DSRC_CODE) < 0;
                });
            })
        ).subscribe( (data: SzSdkDataSource[]) => {
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
    public openDataMappings(dataFile: SzDataFile | SzImportedDataFile) {
        if(dataFile && (dataFile as SzImportedDataFile).analysis) { 
            // is uploaded file (non APP)
            console.log(`open edit modal! `, JSON.stringify(dataFile.dataSources));
            this.dialogService.openFromComponent(SzDataFileDataSourceMappingsDialog,
                {
                    minWidth: '600px',
                    minHeight: '400px',
                    data: dataFile
                }
            ).pipe(
                takeUntil(this.unsubscribe$),
                filter((result) => {
                    return result !== undefined && result !== false;
                })
            ).subscribe((result: SzImportedDataFile) => {
                console.log(`Mapping result: `, result, JSON.stringify(result.dataSources));
                if(result && result.uploadName) {
                    // update data
                    let uploadRef = this._uploadedFiles.find((df) => {
                        return df.uploadName === result.uploadName;
                    });
                    if(uploadRef) {
                        console.log(`\tfound item in pending uploads: `, uploadRef);
                        // update properties
                        uploadRef = Object.assign(uploadRef, result);
                        console.log(`\tafter assign`, JSON.stringify(uploadRef.dataSources));
                        uploadRef.dataSources = result.dataSources;
                        console.log(`\tafter explicit override`, JSON.stringify(uploadRef.dataSources));

                        // check if we only have "1" datasource, if so, that's the name we 
                        // display on the card
                        if(result && result.dataSources) {
                            if(result.dataSources.length === 1 && result.dataSources[0] && result.dataSources[0].DSRC_CODE) {
                                uploadRef.name = result.dataSources[0].DSRC_CODE;
                            } else if(result.dataSources.length > 1) {
                                // multiple datasources
                                uploadRef.name = '[Multiple Data Sources]'
                            }
                        }
                    }
                }
                //dataFile.name = 'Test';
                // check if we only have "1" datasource, if so, that's the name we 
                // display on the card
                /*if(result && result.dataSources) {
                    if(result.dataSources.length === 1) {

                    }
                }*/
            });
        }
        //this.animateState = 'slideLeft';
        /*const targetURL = 'projects/' + this.project.id + '/files/'
                    + dataFile.id + '/mappings';
        setTimeout(() => {
          this.router.navigate([targetURL]);
        }, 0);*/
    }
  }