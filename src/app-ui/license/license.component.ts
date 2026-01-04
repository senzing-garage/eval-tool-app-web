import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable, takeUntil, take } from 'rxjs';
import { SzDataMartService, SzGrpcProductService, SzLicenseInfoComponent, SzRecordStatsDonutChart } from '@senzing/eval-tool-ui-common';
import { SzProductLicenseResponse, SzProductVersionResponse } from '@senzing/eval-tool-ui-common/models/grpc';

@Component({
    selector: 'app-license',
    templateUrl: './license.component.html',
    imports: [
      CommonModule,
      SzLicenseInfoComponent
    ],
    styleUrls: ['./license.component.scss'],
    providers: [
      SzDataMartService,
      { provide: SzGrpcProductService, useClass: SzGrpcProductService }
    ]
  })
  export class AppLicenseComponent implements OnInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _licenseInfo: SzProductLicenseResponse;
    private _productInfo: SzProductVersionResponse;

    public get productLicense() {
      return this._productInfo;
    }
    public get productInformation() {
      return this._productInfo;
    }
    
    // --------------------------- license info
    public get advSearch() {
      //if(this._licenseInfo) return this._licenseInfo.advSearch;
      return undefined;
    }
    public get billing() {
      if(this._licenseInfo) return this._licenseInfo.billing;
      return undefined;
    }
    public get contract() {
      if(this._licenseInfo) return this._licenseInfo.contract;
      return undefined;
    }
    public get customer() {
      if(this._licenseInfo) return this._licenseInfo.customer;
      return undefined;
    }
    public get expireDate() {
      if(this._licenseInfo) return this._licenseInfo.expireDate;
      return undefined;
    }
    public get issueDate() {
      if(this._licenseInfo) return this._licenseInfo.issueDate;
      return undefined;
    }
    public get licenseLevel() {
      if(this._licenseInfo) return this._licenseInfo.licenseLevel;
      return undefined;
    }
    public get licenseType() {
      if(this._licenseInfo) return this._licenseInfo.licenseType;
      return undefined;
    }
    public get recordLimit() {
      if(this._licenseInfo) return this._licenseInfo.recordLimit;
      return undefined;
    }
    // --------------------------- product info
    public get productBuildDate() {
      if(this._productInfo) return this._productInfo.BUILD_DATE;
      return undefined;
    }
    public get productBuildNumber() {
      if(this._productInfo) return this._productInfo.BUILD_NUMBER;
      return undefined;
    }
    public get productBuildVersion() {
      if(this._productInfo) return this._productInfo.BUILD_VERSION;
      return undefined;
    }
    public get productCompatibilityVersion() {
      if(this._productInfo && this._productInfo.COMPATIBILITY_VERSION) return this._productInfo.COMPATIBILITY_VERSION.CONFIG_VERSION;
      return undefined;
    }
    public get productName() {
      if(this._productInfo) return this._productInfo.PRODUCT_NAME;
      return undefined;
    }
    public get productSchemaVersion() {
      if(this._productInfo && this._productInfo.SCHEMA_VERSION) return this._productInfo.SCHEMA_VERSION.ENGINE_SCHEMA_VERSION;
      return undefined;
    }
    public get productVersion() {
      if(this._productInfo) return this._productInfo.VERSION;
      return undefined;
    }

    constructor(
      private productService: SzGrpcProductService
    ) {

    }
    ngOnInit () {
      this.productService.getLicense().pipe(
        takeUntil(this.unsubscribe$),
        take(1)
      ).subscribe((response)=>{
        if(response) this._licenseInfo = response;
        console.log(`license info: `, this._licenseInfo);
      });
      this.productService.getVersion().pipe(
        takeUntil(this.unsubscribe$),
        take(1)
      ).subscribe((response)=>{
        if(response) this._productInfo = response;
        console.log(`product info: `, this._productInfo);
      })
    }
}