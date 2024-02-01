const fs = require('fs');

const writeJsonFile = (targetPath, jsonBlobToWrite) => {
  try {
    const dataString = JSON.stringify(jsonBlobToWrite, null, 2);

    fs.writeFileSync(targetPath, dataString, 'utf8', (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`Wrote JSON to ${targetPath}`);
  });
  } catch (err) {
    console.error('Error writing JSON to file:', err);
  }
}

module.exports = writeJsonFile
