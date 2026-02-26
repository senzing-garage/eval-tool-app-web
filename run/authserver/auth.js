'use strict';
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// grab env vars
let env = process.env;

/** Manages admin area auth token state */
class AuthModule {
  configStore = undefined;

  get useCsp() {
    return this.configStore && this.configStore.csp ?  true : false;
  }
  get useCors() {
    return this.configStore && this.configStore.cors && this.configStore.cors !== undefined ?  true : false;
  }
  get corsAllowedOrigin() {
    if( this.useCors ){
      // open file and read options
      let corsOpts = this.corsConfig;
      if(corsOpts && corsOpts.origin) {
        return corsOpts.origin;
      }
    }
  }


  get corsConfig() {
    let corsConfig = this.configStore && this.configStore.cors ? this.configStore.cors : undefined;
    return corsConfig;
  }
  get authConfig() {
    let authConfig = this.configStore && this.configStore.auth ? this.configStore.auth : undefined;
    return authConfig;
  }

  get token() {
    return this.CRYPTED_TOKEN;
  }

  set secret (strSec) {
    this.TOKEN_SECRET = strSec;
    this.CRYPTED_TOKEN = this.generateSignedToken();
  };
  get secret () {
    return this.TOKEN_SECRET;
  }
  set seed(value) {
    this.ADMINTOKEN = value;
  }
  get seed() {
    return this.ADMINTOKEN;
  }

  set tokenSeed(strSec) {
    this.ADMINTOKEN = strSec;
    this.CRYPTED_TOKEN = this.generateSignedToken();
  };

  constructor(options) {
    if(options){
      this.configStore = options;
    }
    this.useRandomSecret = (options && options.auth && options.auth.admin && options.auth.admin.secret) ? false : true;
    this.TOKEN_SECRET = this.useRandomSecret ? this.getRandomSecret() : ((options && options.auth && options.auth.admin && options.auth.admin.secret) ? options.auth.admin.secret : undefined);
    this.ADMINTOKEN = (options && options.auth && options.auth.admin && options.auth.admin.token) ? options.auth.admin.token : this.getRandomTokenSeed();
    this.CRYPTED_TOKEN = this.generateSignedToken();
  }

  auth(req, res, next) {
    try {
      const body = req.body;
      const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;
      if(encodedToken == undefined) {
        throw new Error('Invalid Token "'+ encodedToken +'"');
      }
      const decodedToken = jwt.verify(encodedToken, this.TOKEN_SECRET);
      const decodedAdminToken = decodedToken.adminToken;

      if (this.ADMINTOKEN !== decodedAdminToken) {
        throw new Error('Token mismatch');
      } else {
        next();
      }
    } catch(err) {
      res.status(401).json({
        error: err.message
      });
    }
  }
  getRandomSecret() {
    return uuidv4();
  }
  getRandomTokenSeed() {
    return uuidv4();
  }
  generateSignedToken() {
    const token = jwt.sign(
    { adminToken: this.ADMINTOKEN },
    this.TOKEN_SECRET,
    { expiresIn: '24h' });

    return token;
  }

  login(req, res, next) {
    const body = req.body;
    const isValid = (body && body.adminToken) ? body.adminToken : req.query.adminToken == this.ADMINTOKEN;
    if(isValid) {
      const token = jwt.sign(
        { adminToken: this.ADMINTOKEN },
        this.TOKEN_SECRET,
        { expiresIn: '24h' });

      res.status(200).json({
        adminToken: this.ADMINTOKEN,
        token: token
      });
    } else {
      res.status(403).json({
        error: 'Tokens do not match'
      }).end();
    }
  }

}

module.exports = AuthModule;
