import { Component, OnInit, ViewChild, Inject, AfterViewInit, input, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzSdkDataSource } from '@senzing/eval-tool-ui-common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SzDataFile } from 'src/app-ui/models/data-files';



@Component({
    selector: 'data-file',
    templateUrl: './data-file.component.html',
    styleUrls: ['./data-file.component.scss'],
    imports: [
      CommonModule,
      MatDialogModule, 
      MatButtonModule, 
      MatIconModule, MatInputModule
    ]
  })
  export class SzDataFileComponent implements OnInit {
    private _data: SzDataFile;
    private _loading: boolean = false;

    @Input() set data(value: SzDataFile) {
        this._data = value;
    }
    get data() {
        return this._data;
    }
    get name() {
        return this._data.name;
    }
    get createdOn() {
        return this._data.createdOn;
    }
    get totalSize() {
        return this._data.totalSize;
    }
    get dataSourceCode() {
        return this._data.dataSource.DSRC_CODE;
    }
    get dataSourceId() {
        return this._data.dataSource.DSRC_ID;
    }
    constructor(
        //private adminBulkDataService: AdminBulkDataService,
    ) { }
    
    ngOnInit() {
        //this.adminBulkDataService.onDataSourcesChange.subscribe(this.updateDataSourcesList.bind(this));
    }
  }