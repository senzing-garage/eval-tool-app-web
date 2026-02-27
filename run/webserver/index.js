// server related
const express = require('express');
const https = require('https');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
// utils
const path = require('path');
const fs = require('fs');
const csp = require(`helmet-csp`);
const winston = require(`winston`);
let EventEmitter = require('events').EventEmitter;

const inMemoryConfigFromInputs = require('../runtime.datastore.config');

class SzEvalToolWebServer extends EventEmitter {
  STARTUP_MSG     = "";     // this is appended to by multiple functions throughout the startup lifecycle for debugging/stdout
  INSTALL_TYPE    = 'web';  // "web" or "desktop";
  STATIC_ROOT     = path.resolve(path.join(__dirname, '..'+path.sep, '..'+path.sep, 'dist'+path.sep+'@senzing'+path.sep+'eval-tool-app-'+this.INSTALL_TYPE+path.sep+'browser'));
  VIEW_INDEX_PATH = this.STATIC_ROOT;

  constructor(inMemoryConfig) {
    super();
    this.runtimeOptions = inMemoryConfig;

    // write proxy conf to file? (we need this for DEV mode)
    if(inMemoryConfigFromInputs.proxyServerOptions.writeToFile) {
      this.runtimeOptions.writeProxyConfigToFile("../","proxy.conf.json");
    }
  }
  get url() {
    return this.runtimeOptions.config.web.url;
  }
  start() {
    if(!this._EXPRESS_APP) {
      throw new Error("initialize method must be called before SzWebServer.start")
    }
    if(this._EXPRESS_SERVER) {
      throw new Error("server already started or is in the process of attempting to start")
    }
    // set up server(s) instance(s)
    var StartupPromises = [];

    if( this.runtimeOptions.config.web && this.runtimeOptions.config.web.ssl && this.runtimeOptions.config.web.ssl.enabled ){
      // https
      const ssl_opts = {
        key: fs.readFileSync(this.runtimeOptions.config.web.ssl.keyPath),
        cert: fs.readFileSync(this.runtimeOptions.config.web.ssl.certPath)
      }
      let webServerPromise = new Promise((resolve, reject) => {
        this._EXPRESS_SERVER = https.createServer(ssl_opts, this._EXPRESS_APP).listen(this.runtimeOptions.config.web.port, () => {
          console.log('[started] SSL Web Server on port '+ this.runtimeOptions.config.web.port);
          resolve();
        });
      });
      StartupPromises.push(webServerPromise);
      this.STARTUP_MSG_POST = '\n'+'SSL Express Server started on port '+ this.runtimeOptions.config.web.port;
      this.STARTUP_MSG_POST = this.STARTUP_MSG_POST + '\n'+'\tKEY: ' + this.runtimeOptions.config.web.ssl.keyPath;
      this.STARTUP_MSG_POST = this.STARTUP_MSG_POST + '\n'+'\tCERT: ' + this.runtimeOptions.config.web.ssl.certPath;
      this.STARTUP_MSG_POST = this.STARTUP_MSG_POST + '\n'+'';
      this.STARTUP_MSG = this.STARTUP_MSG_POST + this.STARTUP_MSG;
    } else {
      // http
      let webServerPromise = new Promise((resolve, reject) => {
        const startListening = () => {
          this._EXPRESS_SERVER = this._EXPRESS_APP.listen(this.runtimeOptions.config.web.port, () => {
            console.log('[started] Web Server on port '+ this.runtimeOptions.config.web.port);
            resolve();
          });
        };
        if(this.runtimeOptions.initialized) {
          startListening();
        } else {
          // wait for initialization with a 30s timeout
          const timeout = setTimeout(() => {
            reject(new Error('Web Server timed out waiting for initialization'));
          }, 30000);
          this.runtimeOptions.on('initialized', () => {
            clearTimeout(timeout);
            startListening();
          });
        }
      });
      StartupPromises.push(webServerPromise);
    }

    return StartupPromises;
  }

  initialize() {
    if(this._EXPRESS_APP) {
      throw new Error("Web Server already started. Cannot start duplicates.");
    }

    // set up server(s) instance(s)
    this._EXPRESS_APP = express();
    
    this.STARTUP_MSG = '';

    // security options and middleware
    if(this.runtimeOptions.config.cors && this.runtimeOptions.config.cors.origin) {
      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- CORS ENABLED --';
      this._EXPRESS_APP.options('*', cors(this.runtimeOptions.config.cors)) // include before other routes
    }
    if(this.runtimeOptions.config.csp) {
      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- CSP ENABLED --';
      this._EXPRESS_APP.use(csp(this.runtimeOptions.config.csp)); //csp options
    }
    // cors test endpoint
    this._EXPRESS_APP.get('/cors/test', (req, res, next) => {
      res.status(200).json({ status: 'ok' });
    });
    this._EXPRESS_APP.post(`/api/csp/report`, express.json({ type: 'application/csp-report' }), (req, res) => {
      if (req.body && req.body[`csp-report`]) {
        winston.warn(`CSP header violation`, req.body[`csp-report`]);
      }
      res.status(204).end();
    });

    // check if SSL file(s) exist
    if(this.runtimeOptions.config.web.ssl && this.runtimeOptions.config.web.ssl.certPath && this.runtimeOptions.config.web.ssl.keyPath){
      try {
        if (fs.existsSync(this.runtimeOptions.config.web.ssl.certPath) && fs.existsSync(this.runtimeOptions.config.web.ssl.keyPath)) {
          this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- SSL ENABLED --';
          this.runtimeOptions.config.web.ssl.enabled = true;
        } else {
          this.runtimeOptions.config.web.ssl.enabled = false;
        }
      } catch(err) {
        this.runtimeOptions.config.web.ssl.enabled = false;
      }
    }

    // set up proxy tunnels
    if(this.runtimeOptions.config.proxy) {
      let proxyOptions = (inMemoryConfigFromInputs).proxyServerOptions;

      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- REVERSE PROXY PATHS SET UP --';
      if(proxyOptions.logLevel === 'debug') {
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- PROXY LOG LEVEL: '+ proxyOptions.logLevel +' --';
      }

      for(let proxyPath in this.runtimeOptions.config.proxy){
        let proxyTargetOptions = this.runtimeOptions.config.proxy[proxyPath];
        // add custom error handler to prevent XSS/Injection in to error response
        function onError(err, req, res) {
          res.writeHead(500, {
            'Content-Type': 'text/plain'
          });
          res.end('proxy encountered an error.');
        }
        proxyTargetOptions.onError = onError;
        if(proxyOptions.logLevel === 'debug') {
          this.STARTUP_MSG = this.STARTUP_MSG + '\n'+' ['+proxyPath+'] ~> '+ proxyTargetOptions.target +' ('+ JSON.stringify(proxyTargetOptions.pathRewrite) +')';
        }
        this._EXPRESS_APP.use(proxyPath, createProxyMiddleware(proxyTargetOptions));
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+`Added proxy from "${proxyPath}" -> ${proxyTargetOptions.target}`;
      }
    } else {
      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- REVERSE PROXY TUNNELS COULD NOT BE ENABLED --';
    }

    // static files
    let staticPath  = this.STATIC_ROOT;
    this._EXPRESS_APP.use('/', express.static(staticPath));
    // serve static files from virtual directory if specified
    if(this.runtimeOptions.config && 
      this.runtimeOptions.config.web && 
      this.runtimeOptions.config.web.path) {
        this._EXPRESS_APP.use(this.runtimeOptions.config.web.path, express.static(staticPath));
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+`-- VIRTUAL DIRECTORY : ${this.runtimeOptions.config.web.path} --`;
    }
    // we need a wildcarded version due to 
    // queries from virtual directory hosted apps
    // and any number of SPA routes on top of that
    this._EXPRESS_APP.get('{*config_api}/config/api', (req, res, next) => {
      let _retObj = {};
      if(this.runtimeOptions.config.web) {
        if(this.runtimeOptions.config.web.apiPath) {
          _retObj.basePath  = this.runtimeOptions.config.web.apiPath;
        }
        // if "apiPath" set to default "/api" AND virtual dir specified
        // serve "apiPath" under virtual dir instead of root level
        if(this.runtimeOptions.config.web.path && this.runtimeOptions.config.web.path !== '/' && this.runtimeOptions.config.web.apiPath === '/api') {
          _retObj.basePath  = this.runtimeOptions.config.web.path + _retObj.basePath;
          _retObj.basePath  = _retObj.basePath.replace("//","/");
        }
      }
      res.status(200).json( _retObj );
    });

    // add config endpoints
    this.addConfigEndpoints(this._EXPRESS_APP);

    // add csp and other vars to index page(s) template strings
    this.addDefaultIndexView(this._EXPRESS_APP);

  }


  addDefaultIndexView(expressInstance) {
    // SPA page
    this.runtimeOptions.getViewVariables().then((VIEW_VARIABLES)=>{
      console.log(`------------------- VIEW VARIABLES: \t`,VIEW_VARIABLES);

      /** dynamically render SPA page with variables */
      expressInstance.set('views', this.VIEW_INDEX_PATH);
      expressInstance.set('view engine', 'pug');
      expressInstance.get('{*index_root}', (req, res) => {
        res.render('index', VIEW_VARIABLES);
      });
    })
  }

  addConfigEndpoints(expressInstance) {
    // ----------------- start config endpoints -----------------
    let _confBasePath = '';
    let _configRoot = '/conf';
    if(this.runtimeOptions.config && 
      this.runtimeOptions.config.web && 
      this.runtimeOptions.config.web.path && this.runtimeOptions.config.web.path !== '/') {
        _confBasePath = this.runtimeOptions.config.web.path;

    }
    if(this.runtimeOptions.config && 
      this.runtimeOptions.config.web && 
      this.runtimeOptions.config.web.configRoot) {
        _configRoot = this.runtimeOptions.config.web.configRoot;
    }
    expressInstance.get(_confBasePath+_configRoot+'/grpc', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.grpc );
    });
    expressInstance.get(_confBasePath+_configRoot+'/stats', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.stats );
    });
    expressInstance.get(_confBasePath+_configRoot+'/cors', (req, res, next) => {
        res.status(200).json( this.runtimeOptions.config.cors );
    });

    expressInstance.get(_confBasePath+_configRoot+'/csp', (req, res, next) => {
        res.status(200).json( this.runtimeOptions.config.csp );
    });

    // ----------------- wildcards -----------------
    // we need a wildcarded version due to 
    // queries from virtual directory hosted apps
    // and any number of SPA routes on top of that
    expressInstance.get('{*config_root}'+_configRoot+'/grpc', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.grpc );
    });
    expressInstance.get('{*config_root}'+_configRoot+'/stats', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.stats );
    });
    expressInstance.get('{*config_root}'+_configRoot+'/cors', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.cors );
    });
    expressInstance.get('{*config_root}'+_configRoot+'/csp', (req, res, next) => {
        res.status(200).json( this.runtimeOptions.config.csp );
    });
    console.log(`------------- server options ----------------`);
    console.log(`url: "${_confBasePath+_configRoot+'/server'}"`, this.runtimeOptions.config.web);

  }

}

module.exports = SzEvalToolWebServer;
