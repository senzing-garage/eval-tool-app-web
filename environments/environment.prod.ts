import { SzRestConfigurationParameters } from '@senzing/eval-tool-ui-common';

export const environment = {
  production: true,
  test: false
};

// api configuration parameters
export const apiConfig: SzRestConfigurationParameters = {
  'basePath': '/api',
  'withCredentials': true
};
