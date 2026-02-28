import path from 'path';
import { glob } from 'glob';
import {checksumFile} from './run/utils.js';

const getStaticFileHashValues = () => {
    let getHashes = async (keyName, sourcePattern) => {
        let _fileHashes = [];
        const files = await glob(sourcePattern);
        if (files.length === 0) {
            return { name: keyName, value: [] };
        }

        for (const file of files) {
            let encoding    = 'base64';
            let encType     = 'sha256';
            const hash = await checksumFile(file, encoding, encType);
            let _fileHashStr = encType +'-'+ hash;
            _fileHashes.push(_fileHashStr);
        }
        return { name: keyName, value: _fileHashes };
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
        .catch(reject)
    });
}
await getStaticFileHashValues().then((hashLists)=>{
    console.log(`hash values: `, hashLists);
})
