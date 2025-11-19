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
//import { SzRestConfigurationFactory } from './common/sdk-config.factory';
//import { AuthConfigFactory } from './common/auth-config.factory';
/*
import { AuthGuardService } from './services/ag.service';
import { AdminAuthService } from './services/admin.service';
import { SzWebAppConfigService } from './services/config.service';
import { AdminBulkDataService } from './services/admin.bulk-data.service';
*/
const dataMartEnv  = new SzDataMartEnvironment({
  'basePath': '/api',
  'withCredentials': true
});

let grpcEnvValue: SzEvalToolEnvironmentProvider;
const grpcEnvFactory = () => {
  if(!grpcEnvValue) {
    grpcEnvValue = new SzEvalToolEnvironmentProvider(
      {connectionString: `http://localhost:8262/grpc`},
      '/config/grpc'
    )
  }
  return grpcEnvValue;
}

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
    {provide: 'DATAMART_ENVIRONMENT', useValue: dataMartEnv},
    {
      provide: 'GRPC_ENVIRONMENT', 
      useFactory: grpcEnvFactory,
      deps: ['GRPC_ENVIRONMENT_PARAMETERS']
    },
    {provide: 'REST_ENVIRONMENT', useValue: restSdkEnv}
  ]
};