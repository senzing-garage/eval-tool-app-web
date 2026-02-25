import path from 'path';
import glob from 'glob';
import {checksumFile} from './run/utils.js';

const getStaticFileHashValues = () => {
    let getHashes = (keyName, sourcePattern) => {
        return new Promise((resolve, reject) => {
            let _fileHashes = [];
            glob(sourcePattern, (err, files) => {
                if (err) {
                    console.error('Error:', err);
                    return;
                }

                files.forEach((file, fIndex) => {
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
            getHashes('script-src', path.join('dist','@senzing','eval-tool-app-web','browser','*.js'))
        );
        // now the styles
        _promises.push(
            getHashes('style-src', path.join('dist','@senzing','eval-tool-app-web','browser','*.css'))
        );

        Promise.all(_promises)
        .then((retValues)=>{
            retValues.forEach((hashItem) => {
                _hashes[hashItem.name] = hashItem.value;
            });
            resolve(_hashes);
        })
    });
}
await getStaticFileHashValues().then((hashLists)=>{
    console.log(`hash values: `, hashLists);
})
