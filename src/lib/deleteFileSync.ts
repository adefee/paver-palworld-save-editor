import fs from 'fs';

/**
 * Synchronously deletes a file.
 * @param {string} filePath - The path to the file to be deleted.
 */
const deleteFileSync = (filePath: string) => {
  try {
    fs.unlinkSync(filePath);
    console.log(`${filePath} was deleted.`);
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
  }
}

export default deleteFileSync;
