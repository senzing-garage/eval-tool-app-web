// server related
const express = require('express');
const http = require('http');
const https = require('https');
const serveStatic = require('serve-static');
const cors = require('cors');
const apiProxy = require('http-proxy-middleware');
const httpProxy = require('http-proxy');
// authentication
const authBasic = require('express-basic-auth');
// utils
const path = require('path');
const fs = require('fs');
const csp = require(`helmet-csp`);
const winston = require(`winston`);
const sanitize = require("sanitize-filename");
const { getPathFromUrl } = require("../utils");
let EventEmitter = require('events').EventEmitter;

// utils
const AuthModule = require('../authserver/auth');
const inMemoryConfig = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');
const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);

class SzEvalToolWebServer extends EventEmitter {
  STARTUP_MSG = "";

  constructor(inMemoryConfig) {
    super();
    this.runtimeOptions = inMemoryConfig;
    this.auth           = new AuthModule( this.runtimeOptions.config );
    /*
    // auth options
    this.authOptions = runtimeOptions.config.auth;
    this.auth        = new AuthModule( runtimeOptions.config );
    // cors
    this.corsOptions   = runtimeOptions.config.cors;
    // csp
    this. cspOptions    = runtimeOptions.config.csp;
    // proxy config
    var proxyConfig  = runtimeOptions.config.proxy;  // these are the actual path-rewrite/src/target collection objects
    var proxyOptions = (inMemoryConfigFromInputs).proxyServerOptions;  // runtime options used to generate some of the re-write objects etc

    // web server config
    let serverOptions = runtimeOptions.config.web;

    // grpc options
    let grpcOptions   = runtimeOptions.config.grpc;

    // statistics options
    let statsOptions  = runtimeOptions.config.stats;

    // stream options
    let streamOptions = runtimeOptions.config.stream;

    // test options
    let testOptions   = runtimeOptions.config.testing;
    */

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
      return
    }
    if(this._EXPRESS_SERVER) {
      throw new Error("server already started or is in the process of attempting to start")
      return 
    }
    // set up server(s) instance(s)
    var WebSocketProxyInstance;
    var StartupPromises = [];

    if( this.runtimeOptions.config.web && this.runtimeOptions.config.web.ssl && this.runtimeOptions.config.web.ssl.enabled ){
      // https
      const ssl_opts = {
        key: fs.readFileSync(this.runtimeOptions.config.web.ssl.keyPath),
        cert: fs.readFileSync(this.runtimeOptions.config.web.ssl.certPath)
      }
      this._EXPRESS_SERVER = https.createServer(ssl_opts, app).listen(this.runtimeOptions.config.web.port)
      this.STARTUP_MSG_POST = '\n'+'SSL Express Server started on port '+ this.runtimeOptions.config.web.port;
      this.STARTUP_MSG_POST = this.STARTUP_MSG_POST + '\n'+'\tKEY: ', this.runtimeOptions.config.web.keyPath;
      this.STARTUP_MSG_POST = this.STARTUP_MSG_POST + '\n'+'\tCERT: ', this.runtimeOptions.config.web.certPath;
      this.STARTUP_MSG_POST = this.STARTUP_MSG_POST + '\n'+'';
      this.STARTUP_MSG = this.STARTUP_MSG_POST + this.STARTUP_MSG;
    } else {
      // check if we need a websocket proxy
      /** streaming record ingestion deprecated in POC product */
      /*
      let streamServerPromise = new Promise((resolve) => {
        let setupWebsocketProxy = function(streamOptions) {
          if(streamOptions && streamOptions.proxy) {
            var proxy = new httpProxy.createProxyServer({
              target: streamOptions.target
            });
            var wsProxy = http.createServer(function (req, res) {
              proxy.web(req, res);
            });
            wsProxy.on('upgrade', function (req, socket, head) {
              let oldUrl = req.url;
              if(req.url && req.url.startsWith && req.url.substring && req.url.startsWith( getPathFromUrl(this.runtimeOptions.config.web.streamClientUrl) ) && getPathFromUrl(this.runtimeOptions.config.web.streamClientUrl) !== '/') {
                // make sure we strip off that path
                req.url = req.url.substring( getPathFromUrl(this.runtimeOptions.config.web.streamClientUrl).length );
                if(proxyOptions.logLevel === 'debug') {
                  console.log(`rewrote websocket conn path from "${oldUrl}" to "${req.url}"`);
                }
              } else if(req.url && req.url.startsWith && req.url.startsWith(this.runtimeOptions.config.web.path) && this.runtimeOptions.config.web.path !== '/') {
                req.url = req.url.substring(this.runtimeOptions.config.web.path.length);
              } else {
                req.url = req.url;
              }
              proxy.ws(req, socket, head);
            });
            wsProxy.listen(streamOptions.proxy.port || 8255, () => {
              console.log('[started] WS Proxy Server on port '+ (streamOptions.proxy.port || 8255) +'. Forwarding to "'+ streamOptions.target +'"');
              resolve();
            });
          } else {
            resolve();
          }
        }
    
        if(this.runtimeOptions.initialized) {
          // immediately check
          streamOptions = this.runtimeOptions.config.stream;
          setupWebsocketProxy(streamOptions);
        } else {
          // wait for initialization
          this.runtimeOptions.on('initialized', () => {
            streamOptions = this.runtimeOptions.config.stream;
            setupWebsocketProxy(streamOptions);
          });
        }
      }, (reason) => { 
        console.log('[error] WS Proxy Server: ', reason);
        reject(); 
      })
      StartupPromises.push(streamServerPromise);
      */
      
      // http
      let webServerPromise = new Promise((resolve) => {
        if(this.runtimeOptions.initialized) {
          this._EXPRESS_SERVER = this._EXPRESS_APP.listen(this.runtimeOptions.config.web.port, () => {
            console.log('[started] Web Server on port '+ this.runtimeOptions.config.web.port);
            resolve();
          });
        } else {
          // wait for initialization
          this.runtimeOptions.on('initialized', () => {
            this._EXPRESS_SERVER = this._EXPRESS_APP.listen(this.runtimeOptions.config.web.port, () => {
              console.log('[started] Web Server on port '+ this.runtimeOptions.config.web.port);
              resolve();
            });
          });
        }
      }, (reason) => { 
        console.log('[error] Web Server', reason);
        reject(); 
      });
      StartupPromises.push(webServerPromise);
      //STARTUP_MSG = '\n'+'Express Server started on port '+ this.runtimeOptions.config.web.port +'\n'+ STARTUP_MSG;
      
      return StartupPromises;
    }
  }

  initialize() {
    if(this._EXPRESS) {
      throw new Error("Web Server already started. Cannot start duplicates.");
      return;
    }

    // set up server(s) instance(s)
    this._EXPRESS_APP = express();
    
    this.STARTUP_MSG = '';
    //this.STARTUP_MSG += "\t RUNTIME OPTIONS: "+ JSON.stringify(inMemoryConfigFromInputs, undefined, 2);

    // security options and middleware
    if(this.runtimeOptions.config.cors && this.runtimeOptions.config.cors.origin) {
      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- CORS ENABLED --';
      this._EXPRESS_APP.options('*', cors(this.runtimeOptions.config.cors)) // include before other routes
    }
    if(this.runtimeOptions.config.csp) {
      //const this.runtimeOptions.config.csp = require('../../auth/csp.conf');
      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- CSP ENABLED --';
      this._EXPRESS_APP.use(csp(this.runtimeOptions.config.csp)); //csp options
    }
    // cors test endpoint
    this._EXPRESS_APP.get('/cors/test', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.auth );
    });
    this._EXPRESS_APP.post(`/api/csp/report`, (req, res) => {
      winston.warn(`CSP header violation`, req.body[`csp-report`])
      res.status(204).end();
    });

    // check if SSL file(s) exist
    if(this.runtimeOptions.config.web.ssl && this.runtimeOptions.config.web.ssl.certPath && this.runtimeOptions.config.web.ssl.keyPath){
      try {
        if (fs.existsSync(this.runtimeOptions.config.web.ssl.certPath) && fs.existsSync(this.runtimeOptions.config.web.ssl.keyPath)) {
          //file exists
          this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- SSL ENABLED --';
          this.runtimeOptions.config.web.ssl.enabled = true;
        } else {
          this.runtimeOptions.config.web.ssl.enabled = false;
        }
      } catch(err) {
        this.runtimeOptions.config.web.ssl.enabled = false;
      }
    }

    // use basic authentication middleware ?
    if( this.runtimeOptions.config.web.authBasicJson ){
      try  {
        this._EXPRESS_APP.use(authBasic({
          challenge: true,
          users: this.runtimeOptions.config.web.authBasicJson
        }));
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- BASIC AUTH MODULE ENABLED --';
      } catch(err){
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- BASIC AUTH MODULE DISABLED : '+ err +' --\n';
        this.runtimeOptions.config.web.authBasicJson = undefined;
        delete this.runtimeOptions.config.web.authBasicJson;
      }

    } else {
      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- BASIC AUTH MODULE DISABLED : no basic auth json provided --';
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
        this._EXPRESS_APP.use(proxyPath, apiProxy(proxyTargetOptions));
      }
    } else {
      this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'-- REVERSE PROXY TUNNELS COULD NOT BE ENABLED --';
    }

    // static files
    let virtualDirs = [];
    let staticPath  = path.resolve(path.join(__dirname, '../../../', 'dist/@senzing/eval-tool-app-desktop/browser'));
    //let webCompPath = path.resolve(path.join(__dirname, '../../', '/node_modules/@senzing/sdk-components-web/'));
    //this._EXPRESS_APP.use('/node_modules/@senzing/sdk-components-web', express.static(webCompPath));
    this._EXPRESS_APP.use('/', express.static(staticPath));
    // serve static files from virtual directory if specified
    if(this.runtimeOptions.config && 
      this.runtimeOptions.config.web && 
      this.runtimeOptions.config.web.path) {
        this._EXPRESS_APP.use(this.runtimeOptions.config.web.path, express.static(staticPath));
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+`-- VIRTUAL DIRECTORY : ${this.runtimeOptions.config.web.path} --`;
    } else {
      //console.log('no virtual directory', this.runtimeOptions.config.web);
    }
    // we need a wildcarded version due to 
    // queries from virtual directory hosted apps
    // and any number of SPA routes on top of that
    this._EXPRESS_APP.get('*/config/api', (req, res, next) => {
      let _retObj = {};
      if(this.runtimeOptions.config.web) {
        if(this.runtimeOptions.config.web.apiPath) {
          _retObj.basePath  = this.runtimeOptions.config.web.apiPath;
        }
        // if "apiPath" set to default "/api" AND virtual dir specified
        // serve "apiPath" under virtual dir instread of root level
        if(this.runtimeOptions.config.web.path && this.runtimeOptions.config.web.path !== '/' && this.runtimeOptions.config.web.apiPath === '/api') {
          _retObj.basePath  = this.runtimeOptions.config.web.path + _retObj.basePath;
          _retObj.basePath  = _retObj.basePath.replace("//","/");
        }
      }
      res.status(200).json( _retObj );
    });

    // admin auth tokens
    const authRes = (req, res, next) => {
      const body = req.body;
      const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;

      res.status(200).json({
        tokenIsValid: true,
        adminToken: encodedToken
      });
    };

    // add config endpoints
    this.addConfigEndpoints(this._EXPRESS_APP);

    // add csp and other vars to index page(s) template strings
    this.addDefaultIndexView(this._EXPRESS_APP);

    // add auth options to paths
    this.addAuthOptions(this._EXPRESS_APP)
  }

  addDefaultIndexView(expressInstance) {
    // SPA page
    let VIEW_VARIABLES = {
      "VIEW_PAGE_TITLE":"Entity Search",
      "VIEW_BASEHREF": (
        this.runtimeOptions.config && 
        this.runtimeOptions.config.web && 
        this.runtimeOptions.config.web.path && 
        this.runtimeOptions.config.web.path.substring((this.runtimeOptions.config.web.path.length - 1)) !== '/'
      ) ? (this.runtimeOptions.config.web.path + '/') : this.runtimeOptions.config.web.path,
      "VIEW_CSP_DIRECTIVES":""
    }

    if(this.runtimeOptions.config.csp && this.runtimeOptions.config.csp.directives) {
      // we have to dynamically serve the html
      // due to CSP not being smart enough about websockets
      let cspContentStr = "";
      let cspKeys       = Object.keys(this.runtimeOptions.config.csp.directives);
      let cspValues     = Object.values(this.runtimeOptions.config.csp.directives);

      for(var _inc=0; _inc < cspKeys.length; _inc++) {
        let cspDirectiveValue = cspValues[_inc] ? cspValues[_inc] : [];
        cspContentStr += cspKeys[_inc] +" "+ cspDirectiveValue.join(' ') +';\n';
      }
      cspContentStr = cspContentStr.trim();
      VIEW_VARIABLES.VIEW_CSP_DIRECTIVES = cspContentStr;
      //VIEW_VARIABLES.debug = true;
      //console.log(`---------------------- CSP VARS`);
      //console.log(VIEW_VARIABLES.VIEW_CSP_DIRECTIVES);
    }

    /** dynamically render SPA page with variables */
    expressInstance.set('views', path.resolve(path.join(__dirname, '..'+path.sep, '..'+path.sep, '..'+path.sep, 'dist/@senzing/eval-tool-app-desktop/browser')));
    expressInstance.set('view engine', 'pug');
    expressInstance.get('*', (req, res) => {
      res.render('index', VIEW_VARIABLES);
    });
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
    expressInstance.get(_confBasePath+_configRoot+'/auth', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.auth );
    });
    expressInstance.get(_confBasePath+_configRoot+'/auth/admin', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.auth.admin );
    });
    expressInstance.get(_confBasePath+_configRoot+'/auth/operator', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.auth.operator );
    });
    expressInstance.get(_confBasePath+_configRoot+'/cors', (req, res, next) => {
        res.status(200).json( this.runtimeOptions.config.cors );
    });

    expressInstance.get(_confBasePath+_configRoot+'/csp', (req, res, next) => {
        res.status(200).json( this.runtimeOptions.config.csp );
    });

    expressInstance.get(_confBasePath+_configRoot+'/streams', (req, res, next) => {
        res.status(200).json( this.runtimeOptions.config.stream );
    });

    // ----------------- wildcards -----------------
    // we need a wildcarded version due to 
    // queries from virtual directory hosted apps
    // and any number of SPA routes on top of that
    expressInstance.get('*'+_configRoot+'/grpc', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.grpc );
    });
    expressInstance.get('*'+_configRoot+'/stats', (req, res, next) => {
      res.status(200).json( statsOptions );
    });
    expressInstance.get('*'+_configRoot+'/auth', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.auth );
    });
    expressInstance.get('*'+_configRoot+'/cors', (req, res, next) => {
      res.status(200).json( this.runtimeOptions.config.cors );
    });
    expressInstance.get('*'+_configRoot+'/csp', (req, res, next) => {
        res.status(200).json( this.runtimeOptions.config.csp );
    });
    expressInstance.get('*'+_configRoot+'/streams', (req, res, next) => {
        res.status(200).json( streamOptions );
    });
    console.log(`------------- server options ----------------`);
    console.log(`url: "${_confBasePath+_configRoot+'/server'}"`, this.runtimeOptions.config.web);

  }

  addAuthOptions(expressInstance) {
    if(this.runtimeOptions.config.auth && this.runtimeOptions.config.auth !== undefined) {
      let _authBasePath = '';
      if(this.runtimeOptions.config && 
        this.runtimeOptions.config.web && 
        this.runtimeOptions.config.web.path && this.runtimeOptions.config.web.path !== '/') {
          _authBasePath = this.runtimeOptions.config.web.path;
      }
      if(this.runtimeOptions.config.auth.admin && this.runtimeOptions.config.auth.admin.mode === 'SSO' || this.runtimeOptions.config.auth.admin && this.runtimeOptions.config.auth.admin.mode === 'EXTERNAL') {
        const ssoResForceTrue = (req, res, next) => {
          res.status(200).json({
            authorized: true,
          });
        };
        const ssoResForceFalse = (req, res, next) => {
          res.status(401).json({
            authorized: false,
          });
        };
        // dunno if this should be a reverse proxy req or not
        // especially if the SSO uses cookies etc
        expressInstance.get(_authBasePath+'/sso/admin/status', ssoResForceTrue);
        expressInstance.get(_authBasePath+'/sso/admin/login', (req, res, next) => {
          res.sendFile(path.resolve(path.join(__dirname,'../../', '/auth/sso-login.html')));
        });
        //this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'---------------------';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'--- Auth SETTINGS ---';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        //this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'/admin area:';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+ JSON.stringify(this.runtimeOptions.config.auth, null, "  ");
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        //this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'/ operators:';
        //this.STARTUP_MSG = this.STARTUP_MSG + '\n'+ JSON.stringify(adminAuth.authConfig.admin, null, "  ");
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'---------------------';
    
      } else if(this.runtimeOptions.config.auth.admin && this.runtimeOptions.config.auth.admin.mode === 'JWT' || this.runtimeOptions.config.auth.admin && this.runtimeOptions.config.auth.admin.mode === 'BUILT-IN') {
        const jwtRes = (req, res, next) => {
          const body = req.body;
          const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;
    
          res.status(200).json({
            tokenIsValid: true,
            adminToken: encodedToken
          });
        };
        const jwtResForceTrue = (req, res, next) => {
          res.status(200).json({
            tokenIsValid: true,
          });
        };
        /** admin endpoints */
        /*
        expressInstance.post('/jwt/admin/status', jwtResForceTrue);
        expressInstance.post('/jwt/admin/login', jwtResForceTrue);
        expressInstance.get('/jwt/admin/status', jwtResForceTrue);
        expressInstance.get('/jwt/admin/login', jwtResForceTrue);
        */
    
        expressInstance.post(_authBasePath+'/jwt/admin/status', this.auth.auth.bind(this.auth), jwtRes);
        expressInstance.post(_authBasePath+'/jwt/admin/login', this.auth.login.bind(this.auth));
        expressInstance.get(_authBasePath+'/jwt/admin/status', this.auth.auth.bind(this.auth), jwtRes);
        expressInstance.get(_authBasePath+'/jwt/admin/login', this.auth.auth.bind(this.auth), jwtRes);
    
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'To access the /admin area you will need a Admin Token.';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'Admin Tokens are generated from a randomly generated secret unless one is specified with the -adminSecret flag.';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'---------------------';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'ADMIN SECRET: '+ this.auth.secret;
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'ADMIN SEED:   '+ this.auth.seed;
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'ADMIN TOKEN:  ';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+ this.auth.token;
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'---------------------';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'Copy and Paste the line above when prompted for the Admin Token in the admin area.';
      } else {
        // no auth
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'---------------------';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'    CAUTION    ';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'/admin path not protected via ';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'authentication mechanism.';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'To add built-in Token authentication for the /admin path '
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'set the \'SENZING_WEB_SERVER_ADMIN_AUTH_MODE="JWT"\' env variable ';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'or the \'adminAuthMode="JWT"\' command line arg.'
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'To add an external authentication check configure your ';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'proxy to resolve with a 401 or 403 header for ';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'"/admin/auth/status" requests to this instance.';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'Set the auth mode to SSO by setting \'SENZING_WEB_SERVER_ADMIN_AUTH_MODE="SSO"\'';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'A failure can be redirected by setting "SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT="https://my-sso.my-domain.com/path-to/login""';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'or via cmdline \'adminAuthRedirectUrl="https://my-sso.my-domain.com/path-to/login"\''
    
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'---------------------';
        this.STARTUP_MSG = this.STARTUP_MSG + '\n'+'';
      }
    }
  }
}

module.exports = SzEvalToolWebServer;

// ------------------------------------------------------------------------

//console.log('\n\n STATIC PATH: '+staticPath,'\n');
