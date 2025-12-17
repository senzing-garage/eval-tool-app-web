import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { SzRestConfiguration, SzDataMartEnvironment } from '@senzing/eval-tool-ui-common';
import { provideHttpClient } from '@angular/common/http';

// config factory for sdk(s)
/**
* Pull in api configuration(SzRestConfigurationParameters)
* from: environments/environment
*
* @example
* ng build -c production
* ng serve -c docker
*/
import { apiConfig, environment } from '../../environments/environment';
import { SzEvalToolEnvironmentProvider } from './services/sz-grpc-environment.provider';
import { SzEvalToolDataMartEnvironmentProvider } from './services/sz-datamart-environment.provider';

//import { SzRestConfigurationFactory } from './common/sdk-config.factory';
//import { AuthConfigFactory } from './common/auth-config.factory';
/*
import { AuthGuardService } from './services/ag.service';
import { AdminAuthService } from './services/admin.service';
import { SzWebAppConfigService } from './services/config.service';
import { AdminBulkDataService } from './services/admin.bulk-data.service';
*/

let datamartEnvValue: SzEvalToolDataMartEnvironmentProvider;
let grpcEnvValue: SzEvalToolEnvironmentProvider;

const datamartEnvFactory = () => {
  if(!datamartEnvValue) {
    datamartEnvValue = new SzEvalToolDataMartEnvironmentProvider({
        'basePath': 'http://localhost:8261/data-mart',
        'withCredentials': false
      },
      '/conf/stats'
    )
  }
  // see if we can grab the initial value from the ipcWindow
  if(window['__senzingConfigVariables'] && window['__senzingConfigVariables'].statsConfig) {
    // grab initial value from window scope      
    let __statsConfig = window['__senzingConfigVariables'].statsConfig;
    datamartEnvValue = new SzEvalToolDataMartEnvironmentProvider(__statsConfig, '/conf/stats')
    console.log(`----- GRABBED INITIAL STATS CFG VALUE FROM WINDOW: `, window['__senzingConfigVariables'].statsConfig)
  }
  return datamartEnvValue;
}
const grpcEnvFactory = () => {
  if(!grpcEnvValue) {
    grpcEnvValue = new SzEvalToolEnvironmentProvider(
      {connectionString: `http://localhost:8261`},
      '/config/grpc'
    )
    // see if we can grab the initial value from the ipcWindow
    if(window['__senzingConfigVariables'] && window['__senzingConfigVariables'].grpcConfig) {
      // grab initial value from window scope      
      let __grpcConfig = window['__senzingConfigVariables'].grpcConfig;
      grpcEnvValue = new SzEvalToolEnvironmentProvider(
        {connectionString: __grpcConfig.connectionString},
        __grpcConfig.configPath
      )
      console.log(`----- GRABBED INITIAL GRPC CFG VALUE FROM WINDOW: `, window['__senzingConfigVariables'].grpcConfig)
    }
  }
  return grpcEnvValue;
}

/** THIS SHOULD BE DEPRECATED IN FAVOR OF ONLY USEING REST API FOR 
 * STATS/DATAMART.
 */
const restSdkEnv  = new SzRestConfiguration({
  'basePath': '/api',
  'withCredentials': true
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideHttpClient(),
    provideRouter(routes),
    {provide: 'GRPC_ENVIRONMENT_PARAMETERS', useValue: {connectionString: `http://localhost:8261/grpc`}},
    {provide: 'DATAMART_ENVIRONMENT_PARAMETERS', useValue: {
      'basePath': '/api',
      'withCredentials': true
    }},

    {
      provide: 'DATAMART_ENVIRONMENT',
      useFactory: datamartEnvFactory,
      deps: ['DATAMART_ENVIRONMENT_PARAMETERS']
    },
    {
      provide: 'GRPC_ENVIRONMENT', 
      useFactory: grpcEnvFactory,
      deps: ['GRPC_ENVIRONMENT_PARAMETERS']
    },
    {provide: 'REST_ENVIRONMENT', useValue: restSdkEnv}
  ]
};