const fs = require('fs');
/**
 * Determine if a file exists
 * @param {string} filePath 
 * @returns 
 */
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    console.error('fileExists(): Error checking if file exists', e)
    return false;
  }
}

module.exports = fileExists;
