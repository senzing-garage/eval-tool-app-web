import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, from, interval, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SzConfigurationService, SzServerInfo } from '@senzing/eval-tool-ui-common';
import { HttpClient } from '@angular/common/http';
import { AuthConfig, SzWebAppConfigService } from './config.service';

/**
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  /** options are 'JWT' | 'EXTERNAL' | false */
  public get authMode(): string | boolean {
    return (this._authConfig && this._authConfig.admin && this._authConfig.admin.mode !== undefined) ? this._authConfig.admin.mode : 'SSO';
  }
  public get redirectOnFailure(): boolean {
    return (this._authConfig && this._authConfig.admin && this._authConfig.admin.redirectOnFailure !== undefined) ? this._authConfig.admin.redirectOnFailure : true;
  }
  public get authCheckUrl(): string {
    return this._authConfig && this._authConfig.admin && this._authConfig.admin.checkUrl ? this._authConfig.admin.checkUrl : '/admin/auth/sso/status';
  }
  public get loginUrl(): string {
    return this._authConfig && this._authConfig.admin && this._authConfig.admin.loginUrl ? this._authConfig.admin.loginUrl : 'http://localhost:8000/sso/auth/login';
  }
  private _authConfig: AuthConfig;
  private _configLoadedFromResource = false;

  public get authConfig(): AuthConfig | undefined {
    return this._authConfig;
  }

  public get authConfigLoaded(): boolean {
    return (this._authConfig && this._authConfig !== undefined) ? true : false;
  }
  public get isOnVirtualPath(): boolean {
    return this.virtualPath && this.virtualPath !== undefined ? true : false;
  }
  public get virtualPath(): string | undefined {
    return this._authConfig && this._authConfig.virtualPath && this._authConfig.virtualPath !== '' && this._authConfig.virtualPath !== '/' && this._authConfig.virtualPath !== undefined ? this._authConfig.virtualPath : undefined;
  }

  /** whether or not a user is granted admin rights */
  private _isAuthenticated: boolean = true;
  /** interval that the service queries for session authentication check */
  private _pollingInterval = 120 * 1000;
  /** whether or not a user is granted admin rights */
  public get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }
  /**
   * is rest server in admin mode
   */
  public get isAdminModeEnabled() {
    return true;
  }
  /**
   * when the state of the rest server "enableAdmin" flag is changed.
   */
  public onAdminModeChange: Subject<boolean> =  new Subject<boolean>();
  /**
   * when the state of the rest server "readOnly" flag is changed.
   */
  public onAdminReadOnlyChange: Subject<boolean> =  new Subject<boolean>();

  /**
   * when the authenticated status of the current user has changed
   */
  public onAdminAuthenticatedChange: Subject<boolean> =  new Subject<boolean>();
  /**
   * when the config file is updated
   */
  private _onAuthConfigLoaded: Subject<AuthConfig> =  new Subject<AuthConfig>();
  public onAuthConfigLoaded = this._onAuthConfigLoaded.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: SzConfigurationService,
    private webappConfigService: SzWebAppConfigService
  ) {
    this._authConfig = this.webappConfigService.authConfig;
    this.webappConfigService.onAuthConfigChange.subscribe((authConf: AuthConfig) => {
      this._authConfig = authConf;
      this._onAuthConfigLoaded.next(authConf);
    });

    this.updateAuthConfig().subscribe((aConf) => {
      if(aConf) {
        this._configLoadedFromResource = true;
        this._authConfig = aConf;
        this._onAuthConfigLoaded.next(aConf);
      }
    });
    this.pollForAuthConfigUpdates().subscribe();
  }

  updateAuthConfig(): Observable<AuthConfig> {
    return this.webappConfigService.getRuntimeAuthConfig();
  }

  getIsAuthorized(adminToken?: string) {
    if(!this.authMode) {
      // auth check disabled
      return of(true);
    }
    if(this.authMode === 'JWT' || this.authMode === 'BUILT-IN') {
      if(!adminToken) {
        return of(false);
      }
      return this.verifyJWT(adminToken);
    }
    if(this.authMode === 'EXTERNAL' || this.authMode === 'SSO') {
      if(!this.authCheckUrl) {
        console.warn('NO AUTH CHECK URL for SSO! ', this.authCheckUrl);
        return of(false);
      }
      return this.verifyExternalAuthByCode();
    }
  }

  /** verify that an external resource(ie: SSO or proxy path) returns a non-401 or 403 code */
  verifyExternalAuthByCode(): Observable<boolean> {
    return this.http.get<any>(this.authCheckUrl)
      .pipe(
        map( (resp) => {
          return true;
        })
      );
  }

  /** verify a provided JWT token against service */
  verifyJWT(adminToken: string): Observable<boolean> {
    /**
     * in the future we might want to use the /admin/auth/jwt/login to
     * go from straight token validation to masking by looking up against secret.
     */
    if(!adminToken || adminToken === undefined) {
      return  of(false);
    }
    return this.http.get<{adminToken: string | undefined}>(this.authCheckUrl, {
      params: {adminToken: adminToken}})
      .pipe(
        map(result => {
          return (result.adminToken ? true : false);
        })
      );
  }
  /** log a user in with a provided admin token */
  login(adminToken: string): Observable<string | boolean | undefined> {
    /**
     * in the future we might want to use the /admin/auth/jwt/login to
     * go from straight token validation to masking by looking up against secret.
     */
    const res = new Subject<string | boolean>();
    this.verifyJWT(adminToken).subscribe((isValid: boolean) => {
      res.next(adminToken);
    }, (err) => {
      res.next(false);
    });
    return res.asObservable();
  }
  /** clears the JWT token set in local storage */
  logout() {
    localStorage.removeItem('access_token');
  }

  /** poll for auth config changes */
  public pollForAuthConfigUpdates(): Observable<AuthConfig> {
    return interval(this._pollingInterval).pipe(
        switchMap(() => from( this.updateAuthConfig() )),
        tap((aConf) => {
          if(aConf) {
            this._authConfig = aConf;
            this._onAuthConfigLoaded.next(aConf);
          }
        })
    );
  }
}
