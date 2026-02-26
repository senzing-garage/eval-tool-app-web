import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, filter, take } from 'rxjs/operators';
import {
  SzRestConfigurationParameters,
  SzConfigurationService,
  SzServerInfo,
  SzMeta } from '@senzing/eval-tool-ui-common';
import { HttpClient } from '@angular/common/http';

export interface AuthConfig {
  hostname?: string;
  port?: number;
  virtualPath?: string;
  admin: {
    mode: string | boolean;
    checkUrl?: string;
    redirectOnFailure: boolean;
    loginUrl?: string;
  };
  operator?: {
    mode: string | boolean;
    checkUrl?: string;
    redirectOnFailure: boolean;
    loginUrl?: string;
  };
}
export interface POCStreamConfig {
  proxy?: {
    hostname?: string;
    port?: number;
    url: string;
    protocol?: string;
    path?: string;
  }
  target: string;
  protocol?: string;
}

/**
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class SzWebAppConfigService {
  private _authConfig: AuthConfig;
  private _apiConfig: SzRestConfigurationParameters;
  private _pocStreamConfig: POCStreamConfig;
  private _serverInfo: SzServerInfo;
  private _serverInfoMetadata: SzMeta
  private pollingInterval = 60 * 1000;

  public get authConfig(): AuthConfig {
    return this._authConfig;
  }
  public set authConfig(value: AuthConfig) {
    this._authConfig = value;
  }
  public get apiConfig(): SzRestConfigurationParameters {
    return this._apiConfig;
  }
  public set apiConfig(value: SzRestConfigurationParameters) {
    this._apiConfig = value;
  }
  public get pocStreamConfig(): POCStreamConfig {
    return this._pocStreamConfig;
  }
  public set pocStreamConfig(value: POCStreamConfig) {
    this._pocStreamConfig = value;
  }
  public get isReadOnly(): boolean {
    return this._serverInfo && this._serverInfo.readOnly;
  }
  public get isAdminEnabled(): boolean {
    return this._serverInfo && this._serverInfo.adminEnabled;
  }
  public get isPocServerInstance(): boolean {
    return this._serverInfoMetadata && this._serverInfoMetadata.pocApiVersion !== undefined ? true : false;
  }

  /** provide a event subject to notify listeners of updates */
  private _onAuthConfigChange: Subject<AuthConfig>                    = new Subject<AuthConfig>();
  public onAuthConfigChange                                           = this._onAuthConfigChange.asObservable();
  private _onApiConfigChange: Subject<SzRestConfigurationParameters>  = new Subject<SzRestConfigurationParameters>();
  public onApiConfigChange                                            = this._onApiConfigChange.asObservable();
  private _onPocStreamConfigChange: BehaviorSubject<POCStreamConfig>  = new BehaviorSubject<POCStreamConfig>(undefined);
  public onPocStreamConfigChange                                      = this._onPocStreamConfigChange.asObservable();
  private _onServerInfoUpdated: BehaviorSubject<SzServerInfo>         = new BehaviorSubject<SzServerInfo>(undefined);
  public onServerInfoUpdated                                          = this._onServerInfoUpdated.asObservable();

  constructor(
    private http: HttpClient,
    private sdkConfigService: SzConfigurationService
  ) {

    // ---------------------------------------  set up event handlers -------------------------------------------

    // if the api config changes we need to grab a new versions of 
    // stream config and auth config
    // _serverInfo and _serverInfoMetadata
    this.onApiConfigChange.pipe(
      take(5)
    ).subscribe(() => {
      console.log('SzWebAppConfigService: config updated, making new info calls');

      // get updated runtime auth config
      this.getRuntimeAuthConfig().pipe(
        take(1)
      ).subscribe((authConf: AuthConfig) => {
        this._authConfig = authConf;
      });
      // get updated stream config
      this.getRuntimeStreamConfig().pipe(
        take(1)
      ).subscribe((pocConf: POCStreamConfig) => {
        this._pocStreamConfig = pocConf;
        this._onPocStreamConfigChange.next( this._pocStreamConfig );
      });

    });

    // If the server info or server info metadata has been updated we need to 
    // requery for runtime stream config (maybe)
    this.onServerInfoUpdated.pipe(
      filter((srvInfo: undefined | SzServerInfo) => {
        return srvInfo !== undefined && this.isPocServerInstance && this.isAdminEnabled;
      })
    ).subscribe((result) => {
      this.getRuntimeStreamConfig().pipe(
        filter(() => {
          return this.isPocServerInstance && this.isAdminEnabled;
        }),
        take(1)
      ).subscribe((pocConf: POCStreamConfig) => {
        this._pocStreamConfig = pocConf;
        this._onPocStreamConfigChange.next( this._pocStreamConfig );
        console.log('POC STREAM CONFIG', this._pocStreamConfig);
      });
    });

  }

  public getRuntimeAuthConfig(): Observable<AuthConfig> {
    // reach out to webserver to get auth
    // config. we cant do this with static files
    // directly since container is immutable and
    // doesnt write to file system.
    return this.http.get<AuthConfig>('./config/auth');
  }
  public getRuntimeApiConfig(): Observable<SzRestConfigurationParameters> {
    // reach out to webserver to get api
    // config. we cant do this with static files
    // directly since container is immutable and
    // doesnt write to file system.
    return this.http.get<SzRestConfigurationParameters>('./config/api').pipe(
      catchError((err) => {
        // return default payload for local developement when "/config/api" not available
        return of({
          basePath: "/api"
        })
      })
    );
  }
  public getRuntimeStreamConfig(): Observable<POCStreamConfig | undefined> {
    // reach out to webserver to get api
    // config. we cant do this with static files
    // directly since container is immutable and
    // doesnt write to file system.
    return this.http.get<POCStreamConfig | undefined>('./config/streams').pipe(
      catchError((err) => {
        // return default payload for local developement when "/config/api" not available
        return of(undefined);
      })
    );
  }

}
