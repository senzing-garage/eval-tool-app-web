import path from 'path';
import glob from 'glob';
import utils from './run/utils.js';

function getHashes(sourcePattern, keyName) {
    return new Promise((resolve, reject) => {
        let _fileHashes = [];
        //console.log(`getHashes['${keyName}']: "${sourcePattern}"`);
        glob(sourcePattern, (err, files) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
        
            files.forEach((file, fIndex) => {
                let fileName    = file;
                let encoding    = 'base64';
                let encType     = 'sha256';
                //console.log(`file[${fIndex}]: `, file);
                // sha256

                utils.checksumFile(file, encoding, encType).then((hash)=>{
                    let _fileHashStr = encType +'-'+ hash;
                    _fileHashes = _fileHashes.concat([_fileHashStr]);

                    if(_fileHashes.length === files.length) {
                        resolve(_fileHashes);
                        //console.log('resolving: ', _fileHashes)
                    } else {
                        //console.log(`file[${fIndex+1} of ${files.length}]: `, hash);
                    }
                })
            });
        });
    });
}

let _hashes = {};
// first get the js files
await getHashes(path.join('dist','@senzing','eval-tool-app-web','browser','*.js'), 'script-src')
.then((result)=> {
    console.log(`script source hashes: `, result);
    _hashes['script-src'] = result;
})

await getHashes(path.join('dist','@senzing','eval-tool-app-web','browser','*.css'), 'script-src')
.then((result)=> {
    console.log(`script source hashes: `, result);
    _hashes['style-src'] = result;
})

console.log(`hashes: `, _hashes);