import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Inject, Injectable, Optional } from "@angular/core";
import { SzGrpcWebEnvironmentOptions } from "@senzing/sz-sdk-typescript-grpc-web";
import { SzDataMartEnvironment, SzDataMartEnvironmentParameters } from '@senzing/eval-tool-ui-common';

import { catchError, Subject, take, takeUntil } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class SzEvalToolDataMartEnvironmentProvider extends SzDataMartEnvironment {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _configChangePoller;
    private _pollingInterval        = 10000;
    private _configPath             = '/config/stats';
    private httpClient: HttpClient  = inject(HttpClient);

    // eventing
    private _onConfigChangeSubject  = new Subject<SzDataMartEnvironmentParameters>();
    public onConfigChangeSubject    = this._onConfigChangeSubject.asObservable();

    /*constructor(
        @Inject('GRPC_ENVIRONMENT_PARAMETERS') parameters: SzGrpcWebEnvironmentOptions, 
        @Inject('CONFIG_GRPC_PATH')@Optional() _configPath: string
    ){*/
    constructor(
        @Inject('DATAMART_ENVIRONMENT_PARAMETERS') parameters: SzDataMartEnvironmentParameters, 
        @Inject('CONFIG_DATAMART_PATH')@Optional() _configPath: string
    ){
        super(parameters);
        // set up config polling for changes
        this._configChangePoller = setInterval(this.checkForConfigChanges.bind(this), this._pollingInterval);
        // immediately request config
        this.checkForConfigChanges();
    }
    
    private checkForConfigChanges() {
        this.httpClient.get<SzDataMartEnvironmentParameters>(this._configPath).pipe(
            takeUntil(this.unsubscribe$),
            take(1)
        ).subscribe({
            next: (resp: SzDataMartEnvironmentParameters) => {
                let hasChanges  = this.hasConfigChanges(resp);
                this.updatePropertiesFromResponse(resp);
                if(hasChanges) {
                    this._onConfigChangeSubject.next(this.asJSON())
                }
            },
            error: (error: HttpErrorResponse)=>{
                console.log(`ERROR: HTTP error for GRPC config endpoint`, error.message);
            }
        });
    }

    private asJSON(): SzDataMartEnvironmentParameters {
        let retValue: SzDataMartEnvironmentParameters = {};
        if(this.accessToken)                retValue.accessToken        = this.accessToken;
        if(this.additionalHeaders)          retValue.additionalHeaders  = this.additionalHeaders ;
        if(this.apiKeys)                    retValue.apiKeys            = this.apiKeys ;
        if(this.basePath)                   retValue.basePath           = this.basePath ;
        if(this.password)                   retValue.password           = this.password ;
        if(this.username)                   retValue.username           = this.username ;
        if(this.withCredentials)            retValue.withCredentials    = this.withCredentials ;
        return retValue;
    }

    private hasConfigChanges(resp: SzDataMartEnvironmentParameters): boolean {
        let retValue = false;
        if(resp.accessToken && resp.accessToken !== this.accessToken)                   retValue = true;
        if(resp.additionalHeaders && resp.additionalHeaders !== this.additionalHeaders) retValue = true;
        if(resp.apiKeys && resp.apiKeys !== this.apiKeys)                               retValue = true;
        if(resp.basePath && resp.basePath !== this.basePath)                            retValue = true;
        if(resp.password && resp.password !== this.password)                            retValue = true;
        if(resp.username && resp.username !== this.username)                            retValue = true;
        if(resp.withCredentials && resp.withCredentials !== this.withCredentials)       retValue = true;
        return retValue;
    }

    private updatePropertiesFromResponse(resp: SzDataMartEnvironmentParameters) {
        if(resp) {
            if(resp.accessToken)                this.accessToken        = resp.accessToken;
            if(resp.additionalHeaders)          this.additionalHeaders  = resp.additionalHeaders ;
            if(resp.apiKeys)                    this.apiKeys            = resp.apiKeys ;
            if(resp.basePath)                   this.basePath           = resp.basePath ;
            if(resp.password)                   this.password           = resp.password ;
            if(resp.username)                   this.username           = resp.username ;
            if(resp.withCredentials)            this.withCredentials    = resp.withCredentials ;
        }
    }

    ngOnDestroy() {
        console.log('SzEvalToolDataMartEnvironmentProvider.ngOnDestroy: cleaning up...');
        clearInterval(this._configChangePoller);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}