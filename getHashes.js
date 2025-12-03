import path from 'path';
import glob from 'glob';
import {checksumFile} from './run/utils.js';

const getStaticFileHashValues = () => {
    let getHashes = (keyName, sourcePattern) => {
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
                    checksumFile(file, encoding, encType).then((hash)=>{
                        let _fileHashStr = encType +'-'+ hash;
                        _fileHashes = _fileHashes.concat([_fileHashStr]);
    
                        if(_fileHashes.length === files.length) {
                            resolve({
                                name: keyName,
                                value: _fileHashes
                            });
                            //console.log('resolving: ', _fileHashes)
                        } else {
                            //console.log(`file[${fIndex+1} of ${files.length}]: `, hash);
                        }
                    })
                });
            });
        });
    }

    return new Promise((resolve, reject) => {
        let _hashes     = {};
        let _promises   = [];

        // first get the js files
        _promises.push(
            getHashes('script-src', path.join('dist','@senzing','eval-tool-app-web','browser','*.js'), 'script-src')
        );
        // now the styles
        _promises.push(
            getHashes('style-src', path.join('dist','@senzing','eval-tool-app-web','browser','*.css'), 'script-src')
        );

        Promise.all(_promises)
        .then((retValues)=>{
            retValues.forEach((hashItem, index) => {
                //console.log(`[${hashItem.name}]`, hashItem.value, hashItem);
                _hashes[hashItem.name] = hashItem.value;
            });
            resolve(_hashes);
        })
    });
}
await getStaticFileHashValues().then((hashLists)=>{
    console.log(`hash values: `, hashLists);
})