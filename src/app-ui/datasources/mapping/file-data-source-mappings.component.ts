
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SzDataFile, SzImportedDataFile } from '../../models/data-files';
import { SzDataSourcesService, SzGrpcConfigManagerService, SzGrpcEngineService, SzGrpcProductService } from '@senzing/eval-tool-ui-common';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { importHelper } from 'src/app-ui/common/import-utilities';
import { isNotNull } from "../../common/utils";

@Component({
  selector: 'sz-data-source-mappings-dialog',
  templateUrl: './file-data-source-mappings.component.html',
  styleUrls: ['./file-data-source-mappings.component.scss'],
  imports: [
    CommonModule,
    DragDropModule,
    MatBadgeModule, MatButtonModule, MatDialogModule, MatIconModule, MatInputModule, MatTableModule
  ]
})
export class SzDataFileDataSourceMappingsDialog {
    public isInProgress = false;
    private importHelper: importHelper;
    public dataSourcesToRemap = new Map<string, string>;

    public get analysis() {
        if((this.data as SzImportedDataFile).analysis) {
            return (this.data as SzImportedDataFile).analysis
        }
        return undefined;
    }
    public get file() {
        if((this.data as SzImportedDataFile).analysis) {
            return (this.data as SzImportedDataFile);
        }
        return undefined;
    }
    public get hasBlankDataSource() {
        return this.data && this.data.analysis ? this.data.analysis.recordsWithDataSourceCount < this.data.analysis.recordCount : false;
    }
    public get displayedColumns(): string[] {
        const retVal = [];
        if( this.hasBlankDataSource) {
          retVal.push('name');
        }
        retVal.push('recordCount', 'recordsWithRecordIdCount','originalName');
        return retVal;
    }
    public get canBeLoaded(): boolean {
        let retVal = !this.isInProgress && (this.analysis ? true : false);
        if(this.hasBlankDataSource) {
          retVal = retVal && this.dataSourcesToRemap.has('NONE') && isNotNull(this.dataSourcesToRemap.get('NONE'));
        }
        return retVal;
    }
    public get dataSourcesForPulldown() {
        return this.importHelper.dataSources;
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: SzImportedDataFile,
        @Inject('GRPC_ENVIRONMENT') private SdkEnvironment: SzGrpcWebEnvironment,
        private productService: SzGrpcProductService,
        private engineService: SzGrpcEngineService,
        //private adminBulkDataService: AdminBulkDataService,
        private datasourcesService: SzDataSourcesService,
        private configManagerService: SzGrpcConfigManagerService
    ) {
        console.log(`data source mappings: `, this.data);
        this.importHelper = new importHelper(
                    this.SdkEnvironment,
                    this.productService,
                    this.engineService,
                    this.configManagerService
        );
    }

    public getResult(confirmed: boolean) : boolean {
        return confirmed;
    }

    /** get the file size for computer notation to display */
    public getFileSize(sizeInBytes: number) {
        let _retVal = '';
        if(sizeInBytes > 999999999) {
            // gb
            _retVal = (sizeInBytes / 1000000000 ).toFixed(1) + ' GB';
        } else if (sizeInBytes > 999999) {
            // mb
            _retVal = (sizeInBytes / 1000000 ).toFixed(1) + ' MB';
        } else if (sizeInBytes > 999) {
            // mb
            _retVal = (sizeInBytes / 1000 ).toFixed(1) + ' KB';
        } else {
            _retVal = (sizeInBytes).toFixed(0) + ' Bytes';
        }
        return _retVal;
    }
    public isNewDataSource(value: string) {
        return this.importHelper.isNewDataSource(value);
    }
    public isMappedNewDataSource(originalName: string): boolean {
        return this.importHelper.isMappedNewDataSource(originalName, this.dataSourcesToRemap.get('NONE'));
    }
    public isBlankDataSource(originalName: string): boolean {
        return this.importHelper.isBlankDataSource(originalName);
    }
    /** when user changes the destination for a datasource */
    public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
        let _srcKey   = fromDataSource && fromDataSource.trim() !== '' ? fromDataSource : 'NONE';
        let _destKey  = toDataSource;
        this.dataSourcesToRemap.set(_srcKey, _destKey);
        console.log(`handleDataSourceChange: "${_srcKey}" => ${_destKey}`, this.dataSourcesToRemap);
        //this.adminBulkDataService.changeDataSourceName(fromDataSource, toDataSource);
    }
    public getDataSourceInputName(index: number): string {
        return 'ds-name-' + index;
    }
    public ifNotEmpty(value: any) {
        let retVal = isNotNull(value) ? value : '';
        return retVal;
    }
}