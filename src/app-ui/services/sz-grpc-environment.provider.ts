import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Inject, Injectable, Optional } from "@angular/core";
import { SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from "@senzing/sz-sdk-typescript-grpc-web";
import { catchError, Subject, take, takeUntil } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class SzEvalToolEnvironmentProvider extends SzGrpcWebEnvironment {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _configChangePoller;
    private _pollingInterval        = 10000;
    private _configPath             = '/config/grpc';
    private httpClient: HttpClient  = inject(HttpClient);

    // eventing
    private _onConnectivityChangeSubject = new Subject();
    public onConnectivityChange     = this._onConnectivityChangeSubject.asObservable();

    /*constructor(
        @Inject('GRPC_ENVIRONMENT_PARAMETERS') parameters: SzGrpcWebEnvironmentOptions, 
        @Inject('CONFIG_GRPC_PATH')@Optional() _configPath: string
    ){*/
    constructor(
        @Inject('GRPC_ENVIRONMENT_PARAMETERS') parameters: SzGrpcWebEnvironmentOptions, 
        @Inject('CONFIG_GRPC_PATH')@Optional() _configPath: string
    ){
        super(parameters);
        this._configChangePoller = setInterval(this.checkForConfigChanges.bind(this), this._pollingInterval);
        //this.addEventListener("initialized", this.onInitialized);
        this.addEventListener("connectivityChange", this._onConnectivityChanged.bind(this));
        this.onConnectivityChange.subscribe(()=>{
            console.log(`subject for connectivity change emitted`);
        })
    }
    
    private checkForConfigChanges() {
        this.httpClient.get<SzGrpcWebEnvironmentOptions>(this._configPath).pipe(
            takeUntil(this.unsubscribe$),
            take(1)
        ).subscribe({
            next: (resp: SzGrpcWebEnvironmentOptions) => {
                if(resp) {
                    if(resp.connectionString)    this.connectionString   = resp.connectionString;
                    if(resp.credentials)         this.credentials        = resp.credentials ;
                    if(resp.grpcOptions)         this.grpcOptions        = resp.grpcOptions ;
                }
            },
            error: (error: HttpErrorResponse)=>{
                console.log(`ERROR: HTTP error for GRPC config endpoint`, error.message);
            }
        });
    }

    private _onConnectivityChanged(value) {
        console.log(`-------------- GRPC connectivity change --------------`);
        this._onConnectivityChangeSubject.next(value);
    }

    ngOnDestroy() {
        console.log('SzEvalToolEnvironmentProvider.ngOnDestroy: cleaning up...');
        clearInterval(this._configChangePoller);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}