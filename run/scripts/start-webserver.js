
const SzEvalToolWebServer   = require("../webserver");
const inMemoryConfig        = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');
const runtimeOptions        = new inMemoryConfig(inMemoryConfigFromInputs);

let webServer = new SzEvalToolWebServer(runtimeOptions);
webServer.initialize();

let StartupPromises    = webServer.start();
console.log( webServer.STARTUP_MSG +'\n');
(async() => {
  await Promise.all(StartupPromises);
  console.log('\n\nPress any key to exit...');
  rl.prompt();
})()

// capture keyboard input for graceful exit
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.on('line', (line) => {
  rl.question('Are you sure you want to exit? (Y/N)', (answer) => {
    if (answer.match(/^y(es)?$/i)) {
      let ShutdownPromises = [];

      ShutdownPromises.push( new Promise((resolve) => {
        ExpressSrvInstance.close(function () {
          console.log('[stopped] Web Server');
          resolve();
        });
      }));
      (async() => {
        await Promise.all(ShutdownPromises).catch((errors) => {
          console.error('Could not shutdown services cleanly');
        });
        process.exit(0);
      })();
    } else {
      console.log('\n\nPress any key to exit...');
      rl.prompt();
    }
  });
});