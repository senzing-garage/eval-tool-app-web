const SzEvalToolWebServer   = require("../webserver");
const inMemoryConfig        = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');
const readline = require('readline');

const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);
let webServer = new SzEvalToolWebServer(runtimeOptions);
webServer.initialize();

let StartupPromises = webServer.start();
console.log( webServer.STARTUP_MSG +'\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async() => {
  await Promise.all(StartupPromises);
  console.log('\n\nPress any key to exit...');
  rl.prompt();
})()

rl.on('line', (line) => {
  rl.question('Are you sure you want to exit? (Y/N)', (answer) => {
    if (answer.match(/^y(es)?$/i)) {
      if (webServer._EXPRESS_SERVER) {
        webServer._EXPRESS_SERVER.close(() => {
          console.log('[stopped] Web Server');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    } else {
      console.log('\n\nPress any key to exit...');
      rl.prompt();
    }
  });
});
