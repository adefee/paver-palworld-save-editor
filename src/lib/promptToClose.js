const readline = require('readline');

const promptToClose = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question("Press enter to exit..", () => {
    rl.close();
    resolve();
  }))
}

module.exports = promptToClose;
