const SzEvalToolConfigServer    = require("../configserver");
const inMemoryConfig            = require("../runtime.datastore");
const inMemoryConfigFromInputs  = require('../runtime.datastore.config');
const readline = require('readline');

const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);
let configServer = new SzEvalToolConfigServer(runtimeOptions);
let StartupPromises = configServer.start();
console.log( configServer.STARTUP_MSG +'\n');

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
      if (configServer._EXPRESS_SERVER) {
        configServer._EXPRESS_SERVER.close(() => {
          console.log('[stopped] Config Server');
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
