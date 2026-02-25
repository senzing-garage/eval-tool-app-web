import { Injectable } from '@angular/core';
import { Observable, timer, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { version as appVersion, dependencies as appDependencies } from '../../../package.json';
import { SzWebAppConfigService } from './config.service';
import { SzGrpcProductService, SzProductLicenseResponse, SzProductVersionResponse } from '@senzing/eval-tool-ui-common';

/**
 * Service to provide package and release versions of key
 * dependencies. used for diagnostics.
 */
@Injectable({
  providedIn: 'root'
})
export class AboutInfoService {
  private _productVersion: SzProductVersionResponse;
  private _productLicense: SzProductLicenseResponse;

  public get productName() {
    if(!this._productVersion) return undefined;
    return this._productVersion.PRODUCT_NAME;
  }
  public get version() {
    if(!this._productVersion) return undefined;
    return this._productVersion.VERSION;
  }
  public get build() {
    if(!this._productVersion) return undefined;
    return {
      version: this._productVersion.BUILD_VERSION,
      date: this._productVersion.BUILD_DATE,
      number: this._productVersion.BUILD_NUMBER
    }
  }
  public get compatibility () {
    if(!this._productVersion) return undefined;
    if(!this._productVersion.COMPATIBILITY_VERSION) return undefined;
    return {
      configVersion: this._productVersion.COMPATIBILITY_VERSION.CONFIG_VERSION
    }
  }
  public get schema() {
    if(!this._productVersion) return undefined;
    if(!this._productVersion.SCHEMA_VERSION) return undefined;
    return {
      engineSchemaVersion: this._productVersion.SCHEMA_VERSION.ENGINE_SCHEMA_VERSION,
      minimumRequiredSchemaVersion: this._productVersion.SCHEMA_VERSION.MINIMUM_REQUIRED_SCHEMA_VERSION,
      maximumRequiredSchemaVersion: this._productVersion.SCHEMA_VERSION.MAXIMUM_REQUIRED_SCHEMA_VERSION
    }
  }

  public get license() {
    return this._productLicense;
  }

  /** release version of the ui app */
  public appVersion: string;
  /** release version of the @senzing/eval-tool-ui-common package*/
  public sdkComponentsVersion: string;
  /** version of the @senzing/sz-sdk-typescript-grpc-web package */
  public grpcClientVersion: string;
  /** version of the @senzing/serve-grpc instance */
  public grpcServerVersion: string;
  /** whether or not new data can be imported */
  public isReadOnly: boolean;
  /** whether or not the admin interface is made available */
  public isAdminEnabled: boolean;
  /** @internal */
  /** polling interval after successful response (10 minutes) */
  private successInterval = 10 * 60 * 1000;
  /** polling interval after failed response (30 seconds) */
  private failInterval = 30 * 1000;

  /** provide a event subject to notify listeners of updates */
  private _onServerInfoUpdated = new BehaviorSubject(this);
  public onServerInfoUpdated = this._onServerInfoUpdated.asObservable();

  /** fetch product info and schedule next poll based on success/failure */
  private fetchAndScheduleProduct() {
    this.getProductInfo().pipe(take(1)).subscribe({
      next: (resp) => {
        this.setProductInfo(resp);
        this.scheduleProductPoll(this.successInterval);
      },
      error: () => {
        this.scheduleProductPoll(this.failInterval);
      }
    });
  }
  /** fetch license info and schedule next poll based on success/failure */
  private fetchAndScheduleLicense() {
    this.getLicenseInfo().pipe(take(1)).subscribe({
      next: (resp) => {
        this.setLicenseInfo(resp);
        this.scheduleLicensePoll(this.successInterval);
      },
      error: () => {
        this.scheduleLicensePoll(this.failInterval);
      }
    });
  }
  /** schedule next product info poll after delay */
  private scheduleProductPoll(delay: number) {
    timer(delay).pipe(take(1)).subscribe(() => this.fetchAndScheduleProduct());
  }
  /** schedule next license info poll after delay */
  private scheduleLicensePoll(delay: number) {
    timer(delay).pipe(take(1)).subscribe(() => this.fetchAndScheduleLicense());
  }
  constructor(
    private configService: SzWebAppConfigService,
    private productService: SzGrpcProductService
  ) {
    this.appVersion = appVersion;
    if(appDependencies) {
      // check to see if we can pull sdk-components-grpc-web and sz-sdk-typescript-grpc-web
      // versions from the package json
      if (appDependencies['@senzing/sz-sdk-typescript-grpc-web']) {
        this.grpcClientVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/sz-sdk-typescript-grpc-web'], '@senzing/sz-sdk-typescript-grpc-web-' );
      }
      if (appDependencies['@senzing/eval-tool-ui-common']) {
        this.sdkComponentsVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/eval-tool-ui-common'], '@senzing/eval-tool-ui-common-' );
      }
    }

    // fetch product and license info from serve-grpc
    // retries every 30s on failure, refreshes every 10min on success
    this.fetchAndScheduleProduct();
    this.fetchAndScheduleLicense();

  }

  /** get license information from serve-grpc */
  public getLicenseInfo(): Observable<SzProductLicenseResponse> {
    // get license info
    return this.productService.getLicense();
  }
  /** get product information from serve-grpc */
  public getProductInfo(): Observable<SzProductVersionResponse> {
    // get product info
    return this.productService.getVersion();
  }
  public getVersionFromLocalTarPath(packagePath: string | undefined, packagePrefix?: string | undefined ): undefined | string {
    let retVal = packagePath;
    if (packagePath && packagePath.indexOf && packagePath.indexOf('file:') === 0) {
      const pathArr = packagePath.split('/');
      const fileName = pathArr.pop();
      if (fileName && fileName.indexOf && fileName.indexOf('.tgz') > -1) {
        let startAt = 0;
        if(packagePrefix && fileName.indexOf(packagePrefix) > -1) {
          startAt = fileName.indexOf(packagePrefix) + packagePrefix.length;
        }
        retVal = fileName.substring(startAt, fileName.indexOf('.tgz'));
      } else if (fileName) {
        retVal = fileName;
      }
    }
    return retVal;
  }
  private setLicenseInfo(response: SzProductLicenseResponse) {
    this._productLicense = response;
  }
  private setProductInfo(response: SzProductVersionResponse) {
    this._productVersion = response;
  }
}
