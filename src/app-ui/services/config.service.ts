import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  SzRestConfigurationParameters,
  SzConfigurationService } from '@senzing/eval-tool-ui-common';
import { HttpClient } from '@angular/common/http';

/**
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class SzWebAppConfigService {
  private _apiConfig: SzRestConfigurationParameters;

  public get apiConfig(): SzRestConfigurationParameters {
    return this._apiConfig;
  }
  public set apiConfig(value: SzRestConfigurationParameters) {
    this._apiConfig = value;
  }

  private _onApiConfigChange: Subject<SzRestConfigurationParameters>  = new Subject<SzRestConfigurationParameters>();
  public onApiConfigChange                                            = this._onApiConfigChange.asObservable();

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

}
