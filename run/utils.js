import fs from 'fs';
import crypto from 'crypto';

export function getHostnameFromUrl(url) {
    if(!url) return;
    if(url) {
        let hostname  = url;
        let _ntemp;
        if(hostname.indexOf && hostname.indexOf('://') > -1) {
            // strip protocol off
            let urlTokened = hostname.split('://');
            hostname  = urlTokened[1];
        }
        if(hostname.indexOf && hostname.indexOf(':') > -1) {
            // strip port off
            _ntemp = hostname.split(':')[0];
            hostname = _ntemp;
        }
        if(hostname.indexOf && hostname.indexOf('/') > -1){
            // strip off anything in path
            _ntemp = hostname.split('/')[0];
            hostname = _ntemp;
        }
        //console.log(`set hostname to: "${hostname}"`);

        return hostname;
    }
    return;
}

export function getPortFromUrl(url) {
    if(!url) return;
    if(url) {
        var hostname    = url;
        var portnumber  = 8250;
        if(hostname.indexOf('://') > -1) {
            // strip protocol off
            let urlTokened = hostname.split('://');
            hostname  = urlTokened[1];
        }
        if(hostname.indexOf(':') > -1) {
            // keep port
            let _ntemp = hostname.split(':');
            if(_ntemp.length > 1 && _ntemp[1]) {
                portnumber    = parseInt(_ntemp[1]);
            }
        }
        return portnumber;
    }
}

export function getProtocolFromUrl(url) {
    if(!url) return;
    if( url ) {
        let protocol    = 'http';
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            protocol  = urlTokened[0];
        }
        return protocol;
    }
}

export function replaceProtocol(protoStr, url) {
    if(!url) return;
    if( url ) {
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            urlTokened[0] = protoStr;
            url = urlTokened.join('://');
        }
    }
    return url;
}

export function getRootFromUrl(url) {
    if(!url) return;
    if( url ) {
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            let urlBase    = urlTokened[1];
            if(urlBase && urlBase.indexOf('/') > -1) {
                urlBase = urlBase.substring(0, urlBase.indexOf('/'));
                urlTokened[1] = urlBase;
            }
            url = urlTokened.join('://');
        }
    }
    return url;
}

export function getPathFromUrl(url) {
    if(!url) return;
    if( url ) {
        let path    = '';
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            let strPath  = urlTokened[1];
            if(strPath.indexOf && strPath.indexOf('/') > -1) {
                path = strPath.substring(strPath.indexOf('/'));
            } else {
                // no "/" in url
            }
        } else if(url.indexOf && url.indexOf('/') > -1) {
            // no protocol, assume first "/" to end
            path = url.substring(url.indexOf('/'));
        }
        return path;
    }
}

/**
 * 
 * @param {*} path path of file to run hash against.
 * @param {*} encoding optional. defaults to "utf-8"
 * @param {*} algorithm optional. defaults to "sha256"
* @returns 
 */
export function checksumFile(path, encoding, algorithm) {
    algorithm   = algorithm === undefined ? 'sha256' : algorithm;
    encoding    = encoding === undefined ? 'utf-8' : encoding;
    return new Promise((resolve, reject) => {
        fs.createReadStream(path).
        pipe(crypto.createHash(algorithm).setEncoding(encoding)).
        on('finish', function () {
            let _fileHash = this.read();
            resolve(_fileHash);
        })
    });
}

export default {
    "getHostnameFromUrl": getHostnameFromUrl,
    "getPathFromUrl": getPathFromUrl,
    "getPortFromUrl": getPortFromUrl,
    "getProtocolFromUrl": getProtocolFromUrl,
    "getRootFromUrl": getRootFromUrl,
    "replaceProtocol": replaceProtocol,
    "checksumFile": checksumFile
}