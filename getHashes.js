import fs from 'fs';
import path from 'path';
import glob from 'glob';


function getHashes(sourcePattern, keyName) {
    return new Promise((resolve, reject) => {
        let _fileHashes = [];
        console.log(`getHashes['${keyName}']: "${sourcePattern}"`);
        glob(sourcePattern, (err, files) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
        
            files.forEach(file => {
                console.log(`file: `, file);
                const path      = file;
                let md5         = '{hash}';
                _fileHashes.push(`${path}: "${md5}"`);
            });

            resolve(_fileHashes);
        });
    });
}

// first get the js files
let scriptSources = []; 
await getHashes(path.join('dist','@senzing','eval-tool-app-web','browser','*.js'), 'script-src')
.then((result)=> {
    console.log(`script source hashes: `, result);
})

console.log('scripts: ', scriptSources)