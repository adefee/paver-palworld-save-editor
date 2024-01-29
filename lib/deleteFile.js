const fs = require('fs');

/**
 * Synchronously deletes a file.
 * @param {string} filePath - The path to the file to be deleted.
 */
function deleteFileSync(filePath) {
    try {
        fs.unlinkSync(filePath);
        console.log(`${filePath} was deleted.`);
    } catch (error) {
        console.error(`Error deleting file: ${error.message}`);
    }
}

module.exports = deleteFileSync;
