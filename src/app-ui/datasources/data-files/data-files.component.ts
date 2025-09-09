import { Component, OnInit, ViewChild, Inject, AfterViewInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzGrpcConfig, SzGrpcConfigManagerService, SzSdkDataSource } from '@senzing/sz-sdk-components-grpc-web';
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
import { SzDataFile } from 'src/app-ui/models/data-files';
import { SzDataFileComponent } from './data-file.component';
import { SzDataSourceCollectionComponent } from './data-source-collection/data-source-collection.component';

@Component({
    selector: 'data-files',
    templateUrl: './data-files.component.html',
    styleUrls: ['./data-files.component.scss'],
    imports: [
      CommonModule,
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
    private _config: SzGrpcConfig; // config that the datasources/files belong to

    public get dataFiles() {
        return this._dataFilesData;
    }

    constructor(
        //private adminBulkDataService: AdminBulkDataService,
        private datasourcesService: SzDataSourcesService,
        private configManagerService: SzGrpcConfigManagerService,
        private titleService: Title,
        public dialog: MatDialog
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
        
        this.getDataSources(); // do first call
        //this.adminBulkDataService.onDataSourcesChange.subscribe(this.updateDataSourcesList.bind(this));
    }

    private onDataFilesResponse() {}
    private onNoDataFilesResponse() {
        // create data files from just datasources
        if(this._dataSourcesData) {

        } else {
            // get data sources
            this.getDataSources().subscribe({
                next: (dataSources) => {
                    let _dataFiles = this._createDataFilesFromDataSources(dataSources);
                    this._dataFilesData = _dataFiles;
                },
                error: () => {
                    
                }
            })
        }
    }

    private _createDataFilesFromDataSources(dataSources: SzSdkDataSource[]) {
        let retVal: SzDataFile[] = [];
        if(dataSources) {
            retVal = dataSources.map((ds) => {
                let _df: SzDataFile = {
                    id: ds.DSRC_ID,
                    name: ds.DSRC_CODE,
                    dataSource: ds,
                    configId: this.configManagerService.defaultConfigId
                }
                return _df;
            })
        }
        return retVal;
    }

    public getDataFiles() {
        let retSub = new Subject();
        retSub.error('data files only available from app context');
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
  }