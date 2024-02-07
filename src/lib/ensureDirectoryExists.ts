import * as fs from 'fs';
import path from 'path';

const ensureDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const ensureFileExists = (filePath) => {
  try {
    ensureDirectoryExists(filePath);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, ''); // Create the file with empty content
      if (process?.env?.DEBUG) {
        console.log(`File created: ${filePath}`);
      }
    }
  } catch (err) {
    console.error(`An error occurred: ${err.message}`);
  }
}

export { ensureDirectoryExists, ensureFileExists };
