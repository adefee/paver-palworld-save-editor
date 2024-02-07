const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const packageJson = require('./package.json');

const output = fs.createWriteStream(path.join(__dirname, `paver-v${packageJson.version}.zip`));



// Define the source and destination paths
const filesToCopy = [
  'paver.exe',
  'README.md',
  'LICENSE',
  'config.example.json',
  'helpers/updatePlayersInLevelSav.py'
];


const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

output.on('close', function() {
    console.log('Archive created successfully with total bytes: ' + archive.pointer());
});

archive.on('error', function(err) {
    throw err;
});

filesToCopy.forEach(fileRelativePath => {
  if (fileRelativePath.endsWith('/')) {
    archive.directory(fileRelativePath);
  } else {
    archive.file(fileRelativePath);
  }
});

archive.pipe(output);
archive.finalize();
