import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import deleteFileSync from './deleteFileSync';
const execAsync = promisify(exec);

/**
 * Given a path and optional label, attempts to convert the file to either JSON or SAV.
 * This is entirely dependent on CheahJS's save-tools library, which can be found here:
 * https://github.com/cheahjs/palworld-save-tools
 * @param {string} relativeInstallPath Relative path to the save-tools install, e.g. "./palworld-save-tools-cheahjs"
 * @param {string} targetPath Target file path for a .sav or .json file. Output will be the opposite format in the same directory.
 * @param {string} label Optional label for use in console output, makes things more human-friendly
 * @returns {[boolean, string[]]} Array with success (boolean), and array of applicable errors.
 */
const convertSavAndJson = async (relativeInstallPath: string, targetPath: string, label: string = ''): Promise<[boolean, string[]]> => {
  const errors = [];

  let convertTargetType = 'SAV';
  if (targetPath.endsWith('.sav')) {
    convertTargetType = 'JSON';
  }

  const fullTargetConversionPath = `${targetPath}${convertTargetType === 'SAV' ? '' : '.json'}`;

  console.info(`Running CheahJS' awesome save-tools to convert to ${convertTargetType} in ${fullTargetConversionPath} (this may take time based on save filesize):`);

  const { stdout, stderr } = await execAsync(`python "${relativeInstallPath}/convert.py" "${targetPath}"`);
  console.log(stdout);

  if (stderr) {
    errors.push(`Error converting ${label || ''} to ${convertTargetType}`);
    console.error('Conversion Error:', stderr);
    return [false, errors]
  } else {
    console.log(`Successfully converted ${label || ''} to ${convertTargetType}!`);
  }
  
  return [true, errors];
}

export default convertSavAndJson;
