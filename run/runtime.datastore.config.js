//const { calcProjectFileAndBasePath } = require("@angular/compiler-cli");
const { createHash } = require('crypto');
const { env } = require("process");
const { 
  getHostnameFromUrl, 
  getPortFromUrl, 
  getProtocolFromUrl, 
  getRootFromUrl, 
  replaceProtocol, 
  getPathFromUrl 
} = require("./utils");

function getCommandLineArgsAsJSON() {
  // grab cmdline args
  let cl = process.argv;
  let cmdLineArgs = undefined;
  // import args in to "cl" JSON style object
  if(cl && cl.forEach){
    cmdLineArgs = {};
    cl.forEach( (val, ind, arr) => {
      let retVal = val;
      let retKey = val;
      if(val && val.indexOf && val.indexOf('=') > -1){
        retKey = (val.split('='))[0];
        retVal = (val.split('='))[1];
      }
      cmdLineArgs[ retKey ] = retVal;
    })
  }
  return cmdLineArgs;
}

function createCorsConfigFromInput( dirToWriteTo ) {
  // return value
  let retConfig = undefined;

  // grab env vars
  let env = process.env;
  if(env.SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN){
    retConfig = {
      "origin": env.SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN,
      "optionsSuccessStatus": 200,
      "optionsFailureStatus": 401
    };
  }

  // grab cmdline args
  let corsOpts = getCommandLineArgsAsJSON();
  if(corsOpts && corsOpts.corsAllowedOrigin) {
    retConfig = {
      "origin": corsOpts.corsAllowedOrigin,
      "optionsSuccessStatus": corsOpts.corsSuccessResponseCode ? corsOpts.corsSuccessResponseCode : 200,
      "optionsFailureStatus": corsOpts.corsFailureResponseCode ? corsOpts.corsFailureResponseCode : 401
    };
  }

  return retConfig;
}

function getTestingOptionsFromInput() {
  let retConfig = undefined;
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    if(cmdLineOpts.testWebServerStartup === true) {
      retConfig = !retConfig ? {} : retConfig;
      retConfig.testWebServerStartup = cmdLineOpts.testWebServerStartup;
    }
  }
  return retConfig;
}

function getGrpcOptionsFromInput() {
  let retConfig = undefined;
  if(env) {
    if(env.SENZING_GRPC_CONNECTION_STRING) {
      retConfig = !retConfig ? {} : retConfig;
      retConfig.connectionString = env.SENZING_GRPC_CONNECTION_STRING;
    }
  }
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    if(cmdLineOpts.grpcConnection) {
      retConfig = !retConfig ? {} : retConfig;
      retConfig.connectionString = cmdLineOpts.grpcConnection;
    }
  }
  return retConfig;
}
/** get grpc config for connection */
function createGrpcConfigFromInput() {
  let grpcCfg   = getGrpcOptionsFromInput();
  return grpcCfg;
}

function getStatsOptionsFromInput() {
  let retConfig = {
    basePath: '/stats',
    withCredentials: false
  };

  if(env) {
    if(env.SENZING_WEB_SERVER_STATS_ACCESS_TOKEN)         retConfig.accessToken         = env.SENZING_WEB_SERVER_STATS_ACCESS_TOKEN;
    if(env.SENZING_WEB_SERVER_STATS_ADDITIONAL_HEADERS)   retConfig.additionalHeaders   = env.SENZING_WEB_SERVER_STATS_ADDITIONAL_HEADERS;
    if(env.SENZING_WEB_SERVER_STATS_API_KEYS)             retConfig.apiKeys             = env.SENZING_WEB_SERVER_STATS_API_KEYS;
    if(env.SENZING_WEB_SERVER_STATS_BASE_PATH)            retConfig.basePath            = env.SENZING_WEB_SERVER_STATS_BASE_PATH;
    if(env.SENZING_WEB_SERVER_STATS_PATH)                 retConfig.basePath            = env.SENZING_WEB_SERVER_STATS_PATH;
    if(env.SENZING_WEB_SERVER_STATS_PASSWORD)             retConfig.password            = env.SENZING_WEB_SERVER_STATS_PASSWORD;
    if(env.SENZING_WEB_SERVER_STATS_USERNAME)             retConfig.username            = env.SENZING_WEB_SERVER_STATS_USERNAME ;
    if(env.SENZING_WEB_SERVER_STATS_WITH_CREDENTIALS)     retConfig.withCredentials     = env.SENZING_WEB_SERVER_STATS_WITH_CREDENTIALS ;
  }
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    if(cmdLineOpts.webServerStatsAccessToken)             retConfig.accessToken        = cmdLineOpts.webServerStatsAccessToken;
    if(cmdLineOpts.webServerStatsAdditionalHeaders)       retConfig.additionalHeaders  = cmdLineOpts.webServerStatsAdditionalHeaders;
    if(cmdLineOpts.webServerStatsApiKeys)                 retConfig.apiKeys            = cmdLineOpts.webServerStatsApiKeys;
    if(cmdLineOpts.webServerStatsBasePath)                retConfig.basePath           = cmdLineOpts.webServerStatsBasePath;
    if(cmdLineOpts.webServerStatsPath)                    retConfig.basePath           = cmdLineOpts.webServerStatsPath;
    if(cmdLineOpts.webServerStatsPassword)                retConfig.password           = cmdLineOpts.webServerStatsPassword;
    if(cmdLineOpts.webServerStatsUsername)                retConfig.username           = cmdLineOpts.webServerStatsUsername;
    if(cmdLineOpts.webServerStatsWithCredentials)         retConfig.withCredentials    = cmdLineOpts.webServerStatsWithCredentials;
  }
  return retConfig;
}

function getStatsConfigFromInput() {
  let retConfig = {
    'basePath': '/statistics',
    'withCredentials': false
  };
  let statsCfgInput  = getStatsOptionsFromInput();
  if(statsCfgInput) {
    if(statsCfgInput.accessToken)             retConfig.accessToken        = statsCfgInput.accessToken;
    if(statsCfgInput.additionalHeaders)       retConfig.additionalHeaders  = statsCfgInput.additionalHeaders;
    if(statsCfgInput.apiKeys)                 retConfig.apiKeys            = statsCfgInput.apiKeys;
    if(statsCfgInput.basePath)                retConfig.basePath           = statsCfgInput.basePath;
    if(statsCfgInput.password)                retConfig.password           = statsCfgInput.password;
    if(statsCfgInput.username)                retConfig.username           = statsCfgInput.username;
    if(statsCfgInput.withCredentials)         retConfig.withCredentials    = statsCfgInput.withCredentials;
  }
  return retConfig;
}

function getInjectionTokenConfig() {
  let grpcCfg               = getGrpcOptionsFromInput();
  let statsCfg              = getStatsOptionsFromInput();

  // generate injection token factory content
  let VIEW_CONFIG_INLINE_SCRIPT = "\n";
  VIEW_CONFIG_INLINE_SCRIPT += "\t"+ "let __senzingConfigVariables = {" +"\n"
  VIEW_CONFIG_INLINE_SCRIPT += "\t\t"+ "statsConfig: "+ JSON.stringify(statsCfg) +",\n"
  VIEW_CONFIG_INLINE_SCRIPT += "\t\t"+ "grpcConfig: "+ JSON.stringify(grpcCfg) +"\n"
  VIEW_CONFIG_INLINE_SCRIPT += "\t"+ "}" +"\n"
  VIEW_CONFIG_INLINE_SCRIPT += "\t"+ "window.__senzingConfigVariables = __senzingConfigVariables;" +"\n"

  return VIEW_CONFIG_INLINE_SCRIPT;
}

function createViewVariablesFromInput() {
  let webOpts               = getWebServerOptionsFromInput();
  let cspOptions            = createCspConfigFromInput();
  let injectionTokenScript  = getInjectionTokenConfig();

  let retVal = {
    "VIEW_PAGE_TITLE":"Entity Search",
    "VIEW_BASEHREF": (
      webOpts && 
      webOpts.path && 
      webOpts.path.substring((webOpts.path.length - 1)) !== '/'
    ) ? (webOpts.path + '/') : webOpts.path,
    "VIEW_CSP_DIRECTIVES":"",
    "VIEW_CONFIG_INLINE_SCRIPT": injectionTokenScript
  }

  // add sha sum for inline script to csp "script-src"
  //let VIEW_CONFIG_INLINE_SCRIPT_SHA256 = "'sha256-"+ createHash('sha256').update(injectionTokenScript).digest('base64') +"'";
  //cspOptions.directives['script-src'].push(VIEW_CONFIG_INLINE_SCRIPT_SHA256);

  // add sha sum's for static script/style files to script-src
  if(cspOptions && cspOptions.directives) {
    // we have to dynamically serve the html
    // due to CSP not being smart enough about websockets
    let cspContentStr = "";
    let cspKeys       = Object.keys(cspOptions.directives);
    let cspValues     = Object.values(cspOptions.directives);

    for(var _inc=0; _inc < cspKeys.length; _inc++) {
      let cspDirectiveValue = cspValues[_inc] ? cspValues[_inc] : [];
      cspContentStr += cspKeys[_inc] +" "+ cspDirectiveValue.join(' ') +';\n';
    }
    cspContentStr = cspContentStr.trim();
    retVal.VIEW_CSP_DIRECTIVES = cspContentStr;
  }
  return retVal;
}

function createCspConfigFromInput() {
  let retConfig = undefined;
  let grpcCfg               = getGrpcOptionsFromInput();
  let injectionTokenScript  = getInjectionTokenConfig();

  // ------------- set sane defaults
  const retConfigDefaults = {
    directives: {
      'default-src': [`'self'`],
      'connect-src': [`'self'`],
      'script-src':  [`'self'`, `'unsafe-eval'`,`'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc='`],
      'img-src':     [`'self'`, `data:`],
      'style-src':   [`'self'`, `'unsafe-inline'`,'https://fonts.googleapis.com'],
      'font-src':    [`'self'`, `https://fonts.gstatic.com`,`https://fonts.googleapis.com`]
    },
    reportOnly: false
  };
  retConfig = JSON.parse(JSON.stringify(retConfigDefaults));
  // ------------- check ENV vars
  if(env.SENZING_WEB_SERVER_CSP_DEFAULT_SRC) {
    retConfig.directives['default-src'].push(env.SENZING_WEB_SERVER_CSP_DEFAULT_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_CONNECT_SRC) {
    retConfig.directives['connect-src'].push(env.SENZING_WEB_SERVER_CSP_CONNECT_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_SCRIPT_SRC) {
    retConfig.directives['script-src'].push(env.SENZING_WEB_SERVER_CSP_SCRIPT_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_IMG_SRC) {
    retConfig.directives['img-src'].push(env.SENZING_WEB_SERVER_CSP_IMG_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_STYLE_SRC) {
    retConfig.directives['style-src'].push(env.SENZING_WEB_SERVER_CSP_STYLE_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_FONT_SRC) {
    retConfig.directives['font-src'].push(env.SENZING_WEB_SERVER_CSP_FONT_SRC);
  }
  // ------------- now get cmdline options and override any defaults or ENV options
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    if(cmdLineOpts.webServerCspDefaultSrc){
      retConfig.directives['default-src'] = retConfigDefaults.directives['default-src']
      retConfig.directives['default-src'].push(cmdLineOpts.webServerCspDefaultSrc);
    }
    if(cmdLineOpts.webServerCspConnectSrc){
      retConfig.directives['connect-src'] = retConfigDefaults.directives['connect-src']
      retConfig.directives['connect-src'].push(cmdLineOpts.webServerCspConnectSrc);
    }
    if(cmdLineOpts.webServerCspScriptSrc){
      retConfig.directives['script-src'] = retConfigDefaults.directives['script-src']
      retConfig.directives['script-src'].push(cmdLineOpts.webServerCspScriptSrc);
    }
    if(cmdLineOpts.webServerCspImgSrc){
      retConfig.directives['img-src'] = retConfigDefaults.directives['img-src']
      retConfig.directives['img-src'].push(cmdLineOpts.webServerCspImgSrc);
    }
    if(cmdLineOpts.webServerCspStyleSrc){
      retConfig.directives['style-src'] = retConfigDefaults.directives['style-src']
      retConfig.directives['style-src'].push(cmdLineOpts.webServerCspStyleSrc);
    }
    if(cmdLineOpts.webServerCspFontSrc){
      retConfig.directives['font-src'] = retConfigDefaults.directives['font-src']
      retConfig.directives['font-src'].push(cmdLineOpts.webServerCspFontSrc);
    }
  }
  // ------------- add grpc connection to connect src
  if( grpcCfg && grpcCfg.connectionString){
    let grpcServer  = getRootFromUrl(grpcCfg.connectionString);
    console.log(`-------------- GRPC added to connect src: ${grpcServer}`);
    retConfig.directives['connect-src'].push(grpcServer);
  } else {
    console.log(`-------------- GRPC NOT added to connect src: ${grpcCfg}`);
    console.log(getCommandLineArgsAsJSON());
  }

  // ------------- add sha sum for inline script to csp "script-src"
  let VIEW_CONFIG_INLINE_SCRIPT_SHA256 = "'sha256-"+ createHash('sha256').update(injectionTokenScript).digest('base64') +"'";
  retConfig.directives['script-src'].push(VIEW_CONFIG_INLINE_SCRIPT_SHA256);

  return retConfig;
}

function getConfigServerOptionsFromInput() {
  let retOpts = {
    protocol: 'http',
    host: `localhost`,
    port: 4200
  }
  if(env){
    retOpts.protocol    = env.SENZING_CONF_SERVER_PROTOCOL  ? env.SENZING_CONF_SERVER_PROTOCOL  : retOpts.protocol;
    retOpts.host        = env.SENZING_CONF_SERVER_HOST      ? env.SENZING_CONF_SERVER_HOST      : retOpts.host;
    retOpts.port        = env.SENZING_WEB_SERVER_PORT       ? env.SENZING_WEB_SERVER_PORT       : retOpts.port;
    retOpts.port        = env.SENZING_CONF_SERVER_PORT      ? env.SENZING_CONF_SERVER_PORT      : retOpts.port;
  }
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    retOpts.protocol    = cmdLineOpts.confServerProtocol    ? cmdLineOpts.confServerProtocol    : retOpts.protocol;
    retOpts.host        = cmdLineOpts.confServerHost        ? cmdLineOpts.confServerHost        : retOpts.host;
    retOpts.port        = cmdLineOpts.webServerPortNumber   ? cmdLineOpts.webServerPortNumber   : retOpts.port;
    retOpts.port        = cmdLineOpts.confServerPortNumber  ? cmdLineOpts.confServerPortNumber  : retOpts.port;
  }
  return retOpts;
}
function getWebServerOptionsFromInput() {
  let retOpts = {
    protocol: 'http',
    port: 4200,
    hostname: 'localhost',
    path: '/',
    apiPath: '/api',
    statsPath: '/stats',
    apiServerUrl: 'http://localhost:8250',
    statsServerUrl: 'http://localhost:8250',
    grpcConnection: 'http://localhost:8260/grpc',
    ssl: {
      certPath: "/run/secrets/server.cert",
      keyPath: "/run/secrets/server.key"
    }
  }
  // update defaults with ENV options(if present)
  if(env){
    retOpts.protocol              = env.SENZING_WEB_SERVER_PROTOCOL ?         env.SENZING_WEB_SERVER_PROTOCOL           : retOpts.protocol;
    retOpts.port                  = env.SENZING_WEB_SERVER_PORT ?             env.SENZING_WEB_SERVER_PORT               : retOpts.port;
    retOpts.hostname              = env.SENZING_WEB_SERVER_HOSTNAME ?         env.SENZING_WEB_SERVER_HOSTNAME           : retOpts.hostname;
    retOpts.url                   = env.SENZING_WEB_SERVER_URL ?              env.SENZING_WEB_SERVER_URL                : retOpts.url;
    retOpts.apiPath               = env.SENZING_WEB_SERVER_API_PATH ?         env.SENZING_WEB_SERVER_API_PATH           : retOpts.apiPath;
    retOpts.statsPath             = env.SENZING_WEB_SERVER_STATS_PATH ?       env.SENZING_WEB_SERVER_STATS_PATH         : retOpts.statsPath;
    retOpts.apiServerUrl          = env.SENZING_API_SERVER_URL ?              env.SENZING_API_SERVER_URL                : retOpts.apiServerUrl;
    retOpts.statsServerUrl        = env.SENZING_DATAMART_SERVER_URL ?         env.SENZING_DATAMART_SERVER_URL           : retOpts.statsServerUrl;
    retOpts.path                  = env.SENZING_WEB_SERVER_VIRTUAL_PATH ?     env.SENZING_WEB_SERVER_VIRTUAL_PATH       : retOpts.path;

    if(env.SENZING_WEB_SERVER_CONFIG_ROOT) {
      retOpts.configRoot     = env.SENZING_WEB_SERVER_CONFIG_ROOT? env.SENZING_WEB_SERVER_CONFIG_ROOT  : retOpts.configRoot;
    }
    if(env.SENZING_WEB_SERVER_SSL_CERT_PATH) {
      retOpts.ssl.certPath        = env.SENZING_WEB_SERVER_SSL_CERT_PATH;
    }
    if(env.SENZING_WEB_SERVER_SSL_KEY_PATH) {
      retOpts.ssl.keyPath         = env.SENZING_WEB_SERVER_SSL_KEY_PATH;
    }
  }

  // now get cmdline options and override any defaults or ENV options
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    retOpts.protocol              = cmdLineOpts.protocol ?              cmdLineOpts.protocol              : retOpts.protocol;
    retOpts.port                  = cmdLineOpts.webServerPortNumber ?   cmdLineOpts.webServerPortNumber   : retOpts.port;
    retOpts.hostname              = cmdLineOpts.webServerHostName ?     cmdLineOpts.webServerHostName     : retOpts.hostname;
    retOpts.url                   = cmdLineOpts.webServerUrl ?          cmdLineOpts.webServerUrl          : retOpts.url;
    retOpts.apiPath               = cmdLineOpts.webServerApiPath ?      cmdLineOpts.webServerApiPath      : retOpts.apiPath;
    retOpts.statsPath             = cmdLineOpts.webServerStatsPath ?    cmdLineOpts.webServerStatsPath    : retOpts.statsPath;
    retOpts.apiServerUrl          = cmdLineOpts.apiServerUrl ?          cmdLineOpts.apiServerUrl          : retOpts.apiServerUrl;
    retOpts.statsServerUrl        = cmdLineOpts.datamartServerUrl ?     cmdLineOpts.datamartServerUrl     : retOpts.statsServerUrl;
    retOpts.grpcConnection        = cmdLineOpts.grpcConnection ?        cmdLineOpts.grpcConnection        : retOpts.grpcConnection;
    retOpts.path                  = cmdLineOpts.virtualPath ?           cmdLineOpts.virtualPath           : retOpts.path;
    
    if(cmdLineOpts.webServerConfigRoot) {
      retOpts.configRoot          = cmdLineOpts.webServerConfigRoot;
    }
    if(retOpts.sslCertPath) {
      retOpts.ssl = retOpts.ssl ? retOpts.ssl : {};
      retOpts.ssl.certPath  = retOpts.sslCertPath;
    }
    if(retOpts.sslKeyPath) {
      retOpts.ssl = retOpts.ssl ? retOpts.ssl : {};
      retOpts.ssl.keyPath   = retOpts.sslKeyPath;
    }
  }

  if(retOpts.ssl && retOpts.ssl !== undefined && retOpts.ssl.certPath && retOpts.ssl.keyPath) {

  } else {
    // for SSL support we need both options
    // remove "ssl" node when invalid
    retOpts.ssl = undefined;
    delete retOpts.ssl;
  }
  // if we just have "hostname" construct "url" from that
  retOpts.url                   = !retOpts.url && retOpts.hostname ? ((retOpts.protocol ? retOpts.protocol + '://' : 'http://') + retOpts.hostname +(retOpts.port ? ':'+ retOpts.port : '')) : retOpts.url;
  let hostnameFromUrL           = getHostnameFromUrl(retOpts.url);
  let portFromUrl               = getPortFromUrl(retOpts.url);
  
  if(hostnameFromUrL && hostnameFromUrL !== retOpts.hostname){
    // override from url
    retOpts.hostname            = hostnameFromUrL;
  }
  if(portFromUrl && portFromUrl !== retOpts.port){
    // override from url
    retOpts.port                = portFromUrl;
  }
  return retOpts;
}

function createWebServerConfigFromInput() {
  let retOpts = getWebServerOptionsFromInput();
  return retOpts;
}

function getProxyServerOptionsFromInput() {
  let configServerOpts  = getConfigServerOptionsFromInput();  // we need full hostname:port for proxy targets

  let retOpts = {
    logLevel: "error",
    apiServerUrl: "",
    statsServerUrl: "",
    configPath: `${configServerOpts.protocol}://${configServerOpts.host}:${configServerOpts.port}`,
    writeToFile: false,
  };

  // update defaults with ENV options(if present)
  if(env){
    if(env.SENZING_WEB_SERVER_PROXY_LOGLEVEL) {
      retOpts.logLevel = env.SENZING_WEB_SERVER_PROXY_LOGLEVEL;
    }
    if(env.SENZING_API_SERVER_URL) {
      retOpts.apiServerUrl = env.SENZING_API_SERVER_URL;
    }
    if(env.SENZING_DATAMART_SERVER_URL) {
      retOpts.statsServerUrl = env.SENZING_DATAMART_SERVER_URL;
    }
    if(env.SENZING_WEB_SERVER_URL) {
      retOpts.configPath = env.SENZING_WEB_SERVER_URL;
    }
    if(env.SENZING_WEB_SERVER_INTERNAL_URL) {
      retOpts.configPath = env.SENZING_WEB_SERVER_INTERNAL_URL;
    }
    if(env.SENZING_AUTH_SERVER_WRITE_CONFIG_TO_FILE === 'true' || env.SENZING_AUTH_SERVER_WRITE_CONFIG_TO_FILE === 'TRUE') {
      retOpts.writeToFile = true;
    }
  }

  // now get cmdline options and override any defaults or ENV options
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    if(cmdLineOpts.proxyLogLevel) {
      retOpts.logLevel = cmdLineOpts.proxyLogLevel;
    }
    if(cmdLineOpts.apiServerUrl && cmdLineOpts.apiServerUrl !== undefined) {
      retOpts.apiServerUrl = cmdLineOpts.apiServerUrl;
    }
    if(cmdLineOpts.datamartServerUrl && cmdLineOpts.datamartServerUrl !== undefined) {
      retOpts.statsServerUrl = cmdLineOpts.datamartServerUrl;
    }
    if(cmdLineOpts.webServerUrl && cmdLineOpts.webServerUrl !== undefined) {
      retOpts.configPath = cmdLineOpts.webServerUrl;
    }
    if(cmdLineOpts.webServerInternalUrl) {
      retOpts.configPath = cmdLineOpts.webServerInternalUrl;
    }
    if(cmdLineOpts.writeProxyConfigToFile === 'true' || cmdLineOpts.writeProxyConfigToFile === 'TRUE') {
      retOpts.writeToFile = true;
    }
  }
  return retOpts;
}

function createProxyConfigFromInput() {
  let retConfig         = undefined;
  let proxyOpts         = getProxyServerOptionsFromInput();
  let cmdLineOpts       = getCommandLineArgsAsJSON();
  let webServerOpts       = getWebServerOptionsFromInput();
  let configServerOpts  = getConfigServerOptionsFromInput();

  let _virtualDir   = (env.SENZING_WEB_SERVER_VIRTUAL_PATH) ? env.SENZING_WEB_SERVER_VIRTUAL_PATH : '/';
  _virtualDir       = (cmdLineOpts && cmdLineOpts.virtualPath) ? cmdLineOpts.virtualPath : _virtualDir;

  if(proxyOpts.apiServerUrl && proxyOpts.apiServerUrl !== undefined) {
    retConfig = retConfig !== undefined ? retConfig : {};
    let _pathRewriteObj = {};
    let _apiVDir        = _virtualDir && _virtualDir !== '/' ? _virtualDir : '';
    let _apiFullPath    = webServerOpts && webServerOpts.apiPath ? webServerOpts.apiPath : '/api';

    // if apiPath unspecified AND virtualDir specified
    // serve api requests from under virtual dir path
    if(_apiFullPath === '/api' && _apiVDir !== '') {
      _apiFullPath    = (_apiVDir + (_apiFullPath ? _apiFullPath : '/api')).replace("//","/");
    } else {
      _apiFullPath    = (_apiFullPath ? _apiFullPath : '/api').replace("//","/");
    }
    _pathRewriteObj["^"+ _apiFullPath ]   = "";

    retConfig[ _apiFullPath ] = {
      "target": proxyOpts.apiServerUrl,
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": _pathRewriteObj
    }
  }
  if(proxyOpts.statsServerUrl && proxyOpts.statsServerUrl !== undefined) {
    retConfig = retConfig !== undefined ? retConfig : {};
    let _pathRewriteObj = {};
    let _apiVDir        = _virtualDir && _virtualDir !== '/' ? _virtualDir : '';
    let _apiFullPath    = webServerOpts && webServerOpts.statsPath ? webServerOpts.statsPath : '/stats';

    // if apiPath unspecified AND virtualDir specified
    // serve api requests from under virtual dir path
    if(_apiFullPath === '/stats' && _apiVDir !== '') {
      _apiFullPath    = (_apiVDir + (_apiFullPath ? _apiFullPath : '/stats')).replace("//","/");
    } else {
      _apiFullPath    = (_apiFullPath ? _apiFullPath : '/stats').replace("//","/");
    }
    _pathRewriteObj["^"+ _apiFullPath ]   = "";

    retConfig[ _apiFullPath ] = {
      "target": proxyOpts.statsServerUrl,
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": _pathRewriteObj
    }
  }

  let appendBasePathToKeys = (obj) => {
    if(_virtualDir !== '/') {
      // re-key object
      let _retObj = {};
      for(let pathKey in obj) {
        let newKey  = !pathKey.startsWith('/api') ? (_virtualDir + pathKey) : pathKey;
        newKey      = newKey.replace("//","/");
        let newVal  = obj[pathKey];
        if(newVal && newVal.pathRewrite) {
          // check pathRewrite for vdir pathing
          let _pathRewriteObj = {};
          console.log('');
          for(let rewriteKey in newVal.pathRewrite) {
            if(rewriteKey && rewriteKey.substring && rewriteKey.indexOf('^/') === 0) {
              // append virtual dir to rewrite
              _pathRewriteObj[ ('^'+ (_virtualDir + rewriteKey.substring(1)).replace("//","/") ) ] = newVal.pathRewrite[ rewriteKey ];
            } else {
              // just return same value
              _pathRewriteObj[ rewriteKey ] = newVal.pathRewrite[ rewriteKey ];
            }
          }
          // update rewrite with any modifications
          newVal.pathRewrite = _pathRewriteObj;
        }
        _retObj[newKey] = newVal;
      }
      return _retObj;
    } else {
      // just return object
      return obj;
    }
  }

  // ------------------------ config endpoints 
  retConfig = retConfig !== undefined ? retConfig : {};
  let mergeObj = appendBasePathToKeys({
    "/config/cors": {
      "target": proxyOpts.configPath + "/conf/cors/",
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": {
        "^/config/cors": ""
      }
    },
    "/config/csp": {
      "target": proxyOpts.configPath + "/conf/csp/",
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": {
        "^/config/csp": ""
      }
    },
    "/config/grpc": {
      "target": proxyOpts.configPath + "/conf/grpc/",
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": {
        "^/config/grpc": ""
      }
    },
    "/config/server": {
      "target": proxyOpts.configPath + "/conf/server/",
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": {
        "^/config/server": ""
      }
    },
    "/config/stats": {
      "target": proxyOpts.configPath + "/conf/stats/",
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": {
        "^/config/stats": ""
      }
    }
  });
  retConfig = Object.assign(retConfig, mergeObj);

  return retConfig;
}

module.exports = {
  "web": createWebServerConfigFromInput(),
  "cors": createCorsConfigFromInput(),
  "csp": createCspConfigFromInput(),
  "grpc": createGrpcConfigFromInput(),
  "proxy": createProxyConfigFromInput(),
  "stats": getStatsConfigFromInput(),
  "testing": getTestingOptionsFromInput(),
  "proxyServerOptions": getProxyServerOptionsFromInput(),
  "view": createViewVariablesFromInput(),
  "webServerOptions": getWebServerOptionsFromInput(),
  "configServerOptions": getConfigServerOptionsFromInput(),
  "getCommandLineArgsAsJSON": getCommandLineArgsAsJSON
}