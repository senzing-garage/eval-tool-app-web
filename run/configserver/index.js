// server related
const express     = require('express');
const https       = require('https');
const serveStatic = require('serve-static');
const cors        = require('cors');
const apiProxy    = require('http-proxy-middleware');
const httpProxy   = require('http-proxy');
// authentication
const authBasic   = require('express-basic-auth');
// utils
const path        = require('path');
const fs          = require('fs');
const csp         = require(`helmet-csp`);
const winston     = require(`winston`);
const sanitize    = require("sanitize-filename");
const { getPathFromUrl } = require("../utils");
const EventEmitter = require('events').EventEmitter;

// utils
const AuthModule = require('../authserver/auth');
const inMemoryConfig = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');
const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);

class SzEvalToolConfigServer extends EventEmitter {
    constructor(inMemoryConfig) {
        super();
        this.runtimeOptions = inMemoryConfig;
        this.auth           = new AuthModule( this.runtimeOptions.config );

        // write proxy conf to file? (we need this for DEV mode)
        if(inMemoryConfigFromInputs.proxyServerOptions.writeToFile) {
            this.runtimeOptions.writeProxyConfigToFile("../","proxy.conf.json");
        }
        this.initialize();
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
        var StartupPromises = [];
        let webServerPromise = new Promise((resolve) => {
            if(this.runtimeOptions.initialized) {
              this._EXPRESS_SERVER = this._EXPRESS_APP.listen(this.runtimeOptions.config.configServer.port, () => {
                console.log('[started] Web Server on port '+ this.runtimeOptions.config.configServer.port);
                resolve();
              });
            } else {
              // wait for initialization
              this.runtimeOptions.on('initialized', () => {
                this._EXPRESS_SERVER = this._EXPRESS_APP.listen(this.runtimeOptions.config.configServer.port, () => {
                  console.log('[started] Web Server on port '+ this.runtimeOptions.config.configServer.port);
                  resolve();
                });
              });
            }
        }, (reason) => { 
            console.log('[error] Web Server', reason);
            reject(); 
        });
        StartupPromises.push(webServerPromise);
        this.STARTUP_MSG = '\n'+'Config Server started on port '+ this.runtimeOptions.config.configServer.port +'\n'+ this.STARTUP_MSG;
          
        return StartupPromises;
    }
    initialize() {
        if(this._EXPRESS) {
          throw new Error("Web Server already started. Cannot start duplicates.");
          return;
        }
        console.log(`config options: `, this.runtimeOptions);
    
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
         // add config endpoints
        this.addConfigEndpoints(this._EXPRESS_APP);
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
        expressInstance.get('*grpcConfigRoute'+_configRoot+'/grpc', (req, res, next) => {
          res.status(200).json( this.runtimeOptions.config.grpc );
        });
        expressInstance.get('*statsConfigRoute'+_configRoot+'/stats', (req, res, next) => {
          res.status(200).json( statsOptions );
        });
        expressInstance.get('*authConfigRoute'+_configRoot+'/auth', (req, res, next) => {
          res.status(200).json( this.runtimeOptions.config.auth );
        });
        expressInstance.get('*corsConfigRoute'+_configRoot+'/cors', (req, res, next) => {
          res.status(200).json( this.runtimeOptions.config.cors );
        });
        expressInstance.get('*cspConfigRoute'+_configRoot+'/csp', (req, res, next) => {
            res.status(200).json( this.runtimeOptions.config.csp );
        });
        expressInstance.get('*streamsConfigRoute'+_configRoot+'/streams', (req, res, next) => {
            res.status(200).json( streamOptions );
        });
        console.log(`------------- server options ----------------`);
        console.log(`url: "${_confBasePath+_configRoot+'/server'}"`, this.runtimeOptions.config.web);
    
    }
}
module.exports = SzEvalToolConfigServer;