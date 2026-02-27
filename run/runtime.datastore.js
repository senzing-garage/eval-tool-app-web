const path = require('path');
const fs = require('fs');
const http = require('http');
const { glob } = require('glob');
const { getPortFromUrl, getHostnameFromUrl, replaceProtocol, checksumFile } = require('./utils');
const { SzGrpcEnvironment, SzGrpcEnvironmentOptions }         = require('@senzing/sz-sdk-typescript-grpc');
const { SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions }   = require('@senzing/sz-sdk-typescript-grpc-web');

let EventEmitter = require('events').EventEmitter;

class inMemoryConfig extends EventEmitter {
  // default web server Configuration
  webConfiguration = {
    protocol: 'http',
    port: 8080,
    hostname: 'senzing-webapp',
    path: '/',
    apiPath: '/api',
    statsPath: '/stats',
    webServerUrl: 'http://senzing-webapp:8080',
    apiServerUrl: 'http://senzing-api-server:8080',
    statsServerUrl: 'http://senzing-api-server:8080',
    grpcConnection: 'http://localhost:8260/grpc',
    configRoot: '/conf',
    /*streamServerUrl: 'ws://localhost:8255', // usually(99%) the address of the LOCAL stream server/proxy
    streamServerPort: 8255, // port number the local stream server proxy should run on
    streamServerDestUrl: 'ws://localhost:8256', // url that the stream proxy should forward sockets to (streamproducer, api server)*/
    ssl: {
      certPath: "/run/secrets/server.cert",
      keyPath: "/run/secrets/server.key"
    }
  };

  // CORS(cross-origin-request) configuration
  corsConfiguration = undefined;
  // CSP (content-security-policy) configuration
  cspConfiguration  = {
    directives: {
      'default-src': [`'self'`],
      'connect-src': [`'self'`],
      'script-src':  [`'self'`, `'unsafe-eval'`,`'unsafe-hashes'`,`'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc='`],
      'img-src':     [`'self'`, `data:`],
      'style-src':   [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
      'font-src':    [`'self'`, `https://fonts.gstatic.com`, `https://fonts.googleapis.com`]
    },
    reportOnly: false
  };

  statsConfiguration = {
    'basePath': '/stats',
    'withCredentials': false
  }
  grpcConfiguration = {
    connectionString: 'http://localhost:8260/grpc'
  }
  viewVariables = {
    "VIEW_PAGE_TITLE":"Entity Search",
    "VIEW_BASEHREF": "localhost",
    "VIEW_CSP_DIRECTIVES":"",
    "VIEW_CONFIG_INLINE_SCRIPT": undefined
  }

  // reverse proxy configuration
  // the reverse proxy allows pointing at resources
  // that are local to the webserver, but are then passed
  // to the api server
  proxyConfiguration = undefined;

  // Stream related configuration
  // defines endpoints, proxy ports/domains etc
  streamServerConfiguration = undefined;

  // options used for package information
  configServerOptions = {
    port: 8080
  };
  

  // initial timer for checking if API Server is up
  statsServerInitializedTimer = undefined;
  
  // initial timer for checking if grpc connection is up
  grpcConnectionInitializedTimer = undefined;

  // options used for testing purposes
  testOptionsConfiguration = undefined;

  // will be set to "true" if initial response 
  // from api server recieved
  _statsServerIsReady     = false;
  _grpcConnectionIsReady  = false;
  _initialized            = false;

  constructor(options) {
    super();
    if(options) {
      this.config = options;
    }

    this.on('grpcConnectionReady', this.onGrpcConnectionReady.bind(this));
    this.on('apiServerReady', this.onApiServerReady.bind(this));
    this.statsServerInitializedTimer      = setInterval(this.checkIfStatsServerInitialized.bind(this), (60 * 1000) * 2);
    this.grpcConnectionInitializedTimer   = setInterval(this.checkIfGrpcConnectionInitialized.bind(this), 2000);
    this.checkIfGrpcConnectionInitialized();
    this.checkIfStatsServerInitialized();
    //console.info("inMemoryConfig.constructor: ", "\n\n", JSON.stringify(this.config, undefined, 2));
  }

  get statsServerIsReady() {
    return this._statsServerIsReady === true;
  }
  get initialized() {
    return this._statsServerIsReady === true && this._grpcConnectionIsReady === true;
  }  

  // get an JSON object representing all of the configuration
  // options specified through either the command line args or env vars
  get config() {
    let retValue = {}
    if(this.grpcConfiguration && this.grpcConfiguration !== undefined && this.grpcConfiguration !== null) {
      retValue.grpc = this.grpcConfiguration;
    }
    if(this.statsConfiguration && this.statsConfiguration !== undefined && this.statsConfiguration !== null) {
      retValue.stats = this.statsConfiguration;
    }
    if(this.corsConfiguration && this.corsConfiguration !== undefined && this.corsConfiguration !== null) {
      retValue.cors = this.corsConfiguration;
    }
    if(this.cspConfiguration && this.cspConfiguration !== undefined && this.cspConfiguration !== null) {
      retValue.csp = this.cspConfiguration;
    }
    if(this.proxyConfiguration && this.proxyConfiguration !== undefined && this.proxyConfiguration !== null) {
      retValue.proxy = this.proxyConfiguration;
    }
    if(this.viewVariables && this.viewVariables !== undefined && this.viewVariables !== null) {
      retValue.view = this.viewVariables;
    }
    if(this.webConfiguration && this.webConfiguration !== undefined && this.webConfiguration !== null) {
      retValue.web = this.webConfiguration;
    }
    if(this.testOptionsConfiguration && this.testOptionsConfiguration !== undefined && this.testOptionsConfiguration !== null) {
      retValue.testing = this.testOptionsConfiguration;
    }
    if(this.configServerOptions && this.configServerOptions !== undefined && this.configServerOptions !== null) {
      retValue.configServer = this.configServerOptions;
    }
    return retValue;
  }
  // set the configuration objects representing
  // options specified through either the command line args or env vars
  set config(value) {
    if(value) {
      if(value.proxy) {
        this.proxyConfiguration = value.proxy;
      }
      if(value.view) {
        this.viewVariables = value.view;
      }
      if(value.web) {
        this.webConfiguration = value.web;
      }
      if(value.grpc) {
        this.grpcConfiguration = value.grpc;
      }
      if(value.stats) {
        this.statsConfiguration = value.stats;
      }
      if(value.cors) {
        this.corsConfiguration  = value.cors;
      }
      if(value.csp) {
        console.log(`csp value: `, value.csp);
        this.cspConfiguration   = value.csp;
      } else {
        // default to this so there is at least a base policy enabled
        this.cspConfiguration = {
          directives: {
            'default-src': [`'self'`],
            'connect-src': [`'self'`],
            'script-src':  [`'self'`, `'unsafe-eval'`,`'unsafe-hashes'`,`'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc='`],
            'style-src':   [`'self'`, `'unsafe-inline'`,`'unsafe-hashes'`,'https://fonts.googleapis.com'],
            'font-src':    [`'self'`, `https://fonts.gstatic.com`, `https://fonts.googleapis.com`]
          },
          reportOnly: false
        };
      }
      if(value.stream) {
        this.streamServerConfiguration = value.stream;
      }
      if(value.testing) {
        this.testOptionsConfiguration = value.testing;
      }
      if(value.configServerOptions) {
        this.configServerOptions = value.configServerOptions;
      }
    }
  }

  getUpdatedCspVariables() {
    return new Promise((resolve, reject)=>{
      let _cspValues = this.cspConfiguration ? this.cspConfiguration : undefined;
      if(_cspValues) {
        console.log(`getViewVariables: `, _cspValues)
      }
      this.getStaticFileHashValues().then((extraSources)=>{
        if(_cspValues && _cspValues.directives){
          for(const _key in _cspValues.directives) {
            let extraItems = extraSources && extraSources[_key] ? extraSources[_key] : [];
            _cspValues.directives[_key] = _cspValues.directives[_key].concat(extraItems);
          }
        }
        console.log(`getViewVariables.getStaticFileHashValues(): `, extraSources, _cspValues);
        resolve(_cspValues);
      });
    });
  }

  getViewVariables() {
    let cspConfig = this.cspConfiguration ? this.cspConfiguration : {};
    let retValue = this.viewVariables ? this.viewVariables : undefined;
    return new Promise((resolve, reject)=> {
      this.getStaticFileHashValues().then((staticFilesCsp)=>{
        if(staticFilesCsp) {
          for(let attributeType in cspConfig.directives) {
            let existingArray     = cspConfig.directives[attributeType];
            let additionalValues  = staticFilesCsp[attributeType];
            if(additionalValues) {
              existingArray = existingArray.concat(additionalValues.map((newValue)=>{
                return "'"+newValue+"'";
              }));
            }
            cspConfig.directives[attributeType] = existingArray;
          }
        }
        let cspContentStr = "";
        let cspKeys       = Object.keys(cspConfig.directives);
        let cspValues     = Object.values(cspConfig.directives);
    
        for(var _inc=0; _inc < cspKeys.length; _inc++) {
          let cspDirectiveValue = cspValues[_inc] ? cspValues[_inc] : [];
          cspContentStr += cspKeys[_inc] +" "+ cspDirectiveValue.join(' ') +';\n';
        }
        cspContentStr = cspContentStr.trim();
        retValue['VIEW_CSP_DIRECTIVES'] = cspContentStr;
        console.log(`getViewVariables.getStaticFileHashValues(): `, cspConfig, cspContentStr);

        resolve(retValue);
      });
    });
  }

  async getStaticFileHashValues() {
    let getHashes = async (keyName, sourcePattern) => {
        const files = await glob(sourcePattern);
        const hashPromises = files.map(async (file) => {
            const hash = await checksumFile(file, 'base64', 'sha256');
            return 'sha256-' + hash;
        });
        return {
            name: keyName,
            value: await Promise.all(hashPromises)
        };
    }

    const results = await Promise.all([
        getHashes('script-src', path.join('dist','@senzing','eval-tool-app-web','browser','*.js'))
    ]);
    const _hashes = {};
    results.forEach((hashItem) => {
        _hashes[hashItem.name] = hashItem.value;
    });
    return _hashes;
  }

  writeProxyConfigToFile(filepath, filename) {
    let fileExists = false;
    let dirExists = false;
    filename = filename && filename !== undefined ? filename : 'proxy.conf.json';

    let fullDir   = path.resolve(__dirname, filepath);
    let fullPath  = path.resolve(fullDir, filename);

    try{
      dirExists  = fs.existsSync(fullDir);
      fileExists = fs.existsSync(fullPath);
    } catch(err){
      fileExists = false;
    }

    if(dirExists) {
      // now write proxy template to file
      try{
        fs.writeFileSync(fullPath, JSON.stringify(this.config.proxy, undefined, 2));
        //file written on disk
        //console.log('wrote ', fullPath ,'\n');
      }catch(err){
        console.log('could not write ', fullPath, '\n', err);
      }
    }
    /*
    console.log("\nwriteProxyConfigToFile: ");
    console.log(filepath, '? ', dirExists);
    console.log(filename, '? ', fileExists);
    console.log('\n');
    console.log(fullDir, '? ', dirExists);
    console.log(fullPath, '? ', fileExists);
    */

  }

  checkIfStatsServerInitialized() {
    //console.log(`stats server url: "${this.webConfiguration.statsServerUrl}"`);
    let reqUrl  = this.webConfiguration.statsServerUrl+'/server-info';
    console.log(`stats server url: ${this.webConfiguration.statsServerUrl}`);
    let req = http.get(reqUrl, (res => {
      //console.log('checkIfApiServerInitialized.response: ', res.statusCode);
      let data = [];
      res.on('data', ((d) => {
        data.push(d);
      }).bind(this))

      res.on('end',(() => {
        if(res.statusCode === 200) {
          const _dataRes = JSON.parse(Buffer.concat(data).toString());
          //console.log('Response ended: \n', _dataRes);
          if(_dataRes) {
            //this.onApiServerReady(_dataRes);
            this.emit('apiServerReady', _dataRes);
          }
        }
      }).bind(this));

    }).bind(this)).on('error', error => {
      console.log('checking if stats server up yet: '+ error.code, '"'+ reqUrl +'"');
    })
  }

  checkIfGrpcConnectionInitialized() {
    setTimeout(()=>{
      this.emit('grpcConnectionReady');
    }, 1000);
  }
  onGrpcConnectionReady( serverInfo ) {
    if(this.grpcConnectionInitializedTimer) {
      clearInterval(this.grpcConnectionInitializedTimer)
    }
    this._grpcConnectionIsReady = true;
    this._initialized = true;
    this.emit('initialized');
    console.log(`GRPC Conmnection ready`);
    /*if(this._apiServerIsReady) {
      this._initialized = true;
      this.emit('initialized');
    }*/
  }
  
  /**
   * When we get a response back from the API_SERVER or POC_SERVER 
   * we do some extra parameter updates and emit the 'initialized' event
   * 
   * @param {*} serverInfo 
   */
  onApiServerReady( serverInfo ) {
    if(this.apiServerInitializedTimer) {
      clearInterval(this.apiServerInitializedTimer)
    }
    //console.log('------- API SERVER INITIALIZED -------\n', serverInfo);

    // are we using a POC Server or an API Server ?
    if(serverInfo.meta) {
      if(serverInfo.meta.pocServerVersion || serverInfo.meta.pocApiVersion) {
        // poc server
        this.webConfiguration.streamLoading = true;
        if(serverInfo.data && !serverInfo.data.adminEnabled) {
          // poc server supports adding datasources and importing data
          this.streamServerConfiguration = undefined;
          this.webConfiguration.streamLoading = false;
        }
        if(!serverInfo.data.loadQueueConfigured) {
          // poc server does not support loading through stream socket
          this.streamServerConfiguration = undefined;
          this.webConfiguration.streamLoading = false;
        }
      } else if(serverInfo.data && !serverInfo.data.adminEnabled) {
        // standard rest server that supports loading data
        this.streamServerConfiguration = undefined;
        this.webConfiguration.streamLoading = false;
      }
    } else {
      this.webConfiguration.streamLoading = false;
    }
    // now notify any listeners that we fully have the data we need
    this._apiServerIsReady = true;
    if(this._grpcConnectionIsReady) {
      this._initialized = true;
      this.emit('initialized');
    }
  }

}


module.exports = inMemoryConfig;
