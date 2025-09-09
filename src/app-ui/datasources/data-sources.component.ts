import { Component, OnInit, ViewChild, Inject, AfterViewInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzSdkDataSource } from '@senzing/sz-sdk-components-grpc-web';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
//import { AdminBulkDataService } from '../../services/admin.bulk-data.service';

export interface DialogData {
  name: string;
}

@Component({
  selector: 'data-sources',
  templateUrl: './data-sources.component.html',
  styleUrls: ['./data-sources.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule, 
    MatTableModule, MatPaginatorModule, MatButtonModule, 
    MatIconModule, MatInputModule
  ]
})
export class AppDataSourcesComponent implements OnInit {
  displayedColumns: string[] = ['DSRC_ID', 'DSRC_CODE'];
  public datasource:  MatTableDataSource<SzSdkDataSource> = new MatTableDataSource<SzSdkDataSource>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  private _datasourcesData: {
    [id: string]: SzSdkDataSource;
  };
  private set dataSourcesData(value: {
    [id: string]: SzSdkDataSource;
  }) {
    this._datasourcesData = value;

    if(this._datasourcesData) {
      this.datasource.data = Object.values( this._datasourcesData );
    }
  }

  private _loading: boolean = false;
  private _dialogOpen: boolean = false;

  public get loading(): boolean {
    return this._loading;
  }

  constructor(
    //private adminBulkDataService: AdminBulkDataService,
    private datasourcesService: SzDataSourcesService,
    private titleService: Title,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.datasource.paginator = this.paginator;
    // set page title
    this.titleService.setTitle( 'Data Sources' );
    this._loading = true;
    this.updateDataSourcesList(); // do first call
    //this.adminBulkDataService.onDataSourcesChange.subscribe(this.updateDataSourcesList.bind(this));
  }

  public updateDataSourcesList() {
    this._loading = true;
    this.datasourcesService.getDataSources().subscribe( (data: SzSdkDataSource[]) => {
      let _data: {
        [id: string]: SzSdkDataSource;
      } = {};
      data.forEach((ds: SzSdkDataSource) => {
        _data[ds.DSRC_ID] = ds;
      });
      this.dataSourcesData = _data;
      this._loading = false;
    } );
  }

  public openNewDataSourceDialog() {
    if(!this._dialogOpen) {
      const dialogRef = this.dialog.open(NewDataSourceDialogComponent, {
        width: '400px',
        data: { name: '' }
      });

      dialogRef.afterClosed().subscribe(dsName => {
        if(dsName && dsName.length > 0) {
          this.datasourcesService.registerDataSources([ dsName ]).subscribe(
            (result) => {
              console.log('created new datasource', result);
              this.updateDataSourcesList();
            }
          );
        }
        this._dialogOpen = false;
      });
    }
  }

}

@Component({
  selector: 'add-datasource-dialog',
  templateUrl: 'add-datasource.component.html',
  styleUrls: ['./add-datasource.component.scss'],
  imports: [
    CommonModule, MatDialogModule,
    FormsModule,
    MatInputModule
  ]
})
export class NewDataSourceDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NewDataSourceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  public isEmpty(value: any): boolean {
    return (value && value.trim() === '');
  }

}
