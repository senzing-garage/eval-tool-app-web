import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  SzRestConfigurationParameters,
  SzConfigurationService } from '@senzing/eval-tool-ui-common';
import { HttpClient } from '@angular/common/http';

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
  private _apiConfig: SzRestConfigurationParameters;
  private _pocStreamConfig: POCStreamConfig;

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

  private _onApiConfigChange: Subject<SzRestConfigurationParameters>  = new Subject<SzRestConfigurationParameters>();
  public onApiConfigChange                                            = this._onApiConfigChange.asObservable();
  private _onPocStreamConfigChange: BehaviorSubject<POCStreamConfig>  = new BehaviorSubject<POCStreamConfig>(undefined);
  public onPocStreamConfigChange                                      = this._onPocStreamConfigChange.asObservable();

  constructor(
    private http: HttpClient,
    private sdkConfigService: SzConfigurationService
  ) {}

  public getRuntimeApiConfig(): Observable<SzRestConfigurationParameters> {
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
    return this.http.get<POCStreamConfig | undefined>('./config/streams').pipe(
      catchError((err) => {
        // return default payload for local developement when "/config/api" not available
        return of(undefined);
      })
    );
  }

}
