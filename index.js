// Require necessary core
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
require('dotenv').config()
var argv = require('minimist')(process.argv.slice(2));

// Require necessary libs
const fileExists = require('./lib/fileExists');
const cloneGitRepo = require('./lib/cloneGitRepo');
const getAppConfig = require('./lib/getAppConfig');
const deleteFileSync = require('./lib/deleteFile');
const convertSavAndJson = require('./lib/convertSavAndJson');

// Main saveEditor
async function saveEditorMain() {
  const errors = [];

  if (!argv || !argv['c']) {
    console.info("Using default config.json path of './config.json'. If you want to use a different path, use the '-c' flag");
  }

  const appConfig = getAppConfig(argv && argv['c'] ? argv['c'] : './config.json');

  if (!appConfig) {
    errors.push('Unable to load app config, so unable to continue.');
    console.error('Local "config.json" file is missing. Please create it - see README or "config.example.json" for details and examples.');
    return;
  }

  // Setup placeholders for converted save data.
  let levelSavJson = null; // This will be the converted Level.sav file, if it exists.
  let levelSavMetaJson = null; // This will be the converted LevelMeta.sav file, if it exists.
  let playerSavJson = null; // This will be all converted Player.sav files (nested together) that exist.

  const {
    enable: enableSavJsonConversion,
    relativeInstallPath: savJsonRelativeInstallPath,
    repoUrl: savJsonRepoUrl,
    convertFreshEveryRun,
  } = appConfig.savToJsonConversion;

  try {
    if (!fileExists(`${savJsonRelativeInstallPath}/convert.py`) && enableSavJsonConversion) {
      // If we have a repoUrl, clone - otherwise, we'll alert user that conversion won't be possible.
      console.info(`Unable to find "convert.py" locally ("${savJsonRelativeInstallPath}/convert.py"), cloning from ${savJsonRepoUrl}...`);

      try {
        await cloneGitRepo(savJsonRepoUrl, savJsonRelativeInstallPath);

        // Check again, and error if still can't find.
        if (!fileExists(`${savJsonRelativeInstallPath}/convert.py`)) {
          errors.push(`Still unable to find "convert.py", so there may have been an issue cloning.`)
        } else {
          console.info(`Found "convert.py" now, so conversion should be possible.`)
          isSavJsonConverterInstalled = true;
        }
      } catch (error) {
        console.error(error);
        errors.push('Error finding or installing ');
      }
    } else if (!enableSavJsonConversion) {
      console.warn('Warning: Save file conversion into JSON is disabled, so given save files must already be in JSON format.');
    } else {
      console.info(`Found CheahJS' save-tools locally ("${savJsonRelativeInstallPath}/convert.py"), so conversion should be possible if necessary.`)
      isSavJsonConverterInstalled = true;
    }

  } catch (err) {
    errors.push(`Checking for or installing CheahJS save-tools failed, see logs.`)
    console.error(`Error save-tools installation stage: ${err.message}`);
  }

  if (errors.length < 1) {
    try {
      const {
        gameSaveDirectoryPath
      } = appConfig;

      console.info(`Checking for save files in ${gameSaveDirectoryPath}...`)

      // First, check for Level.sav
      const levelSavPath = `${gameSaveDirectoryPath}/Level.sav`;
      const levelMetaSavPath = `${gameSaveDirectoryPath}/LevelMeta.sav`;

      // Temp placeholders for iterative conversion
      let iterativeLabel = '';
      let iterativePath = '';

      // Handle Level.sav
      iterativeLabel = 'Label.sav';
      iterativePath = levelSavPath;
      if (fileExists(iterativePath)) {
        console.info(`Found ${iterativeLabel}, checking for existing converted JSON:`)

        let runConversion = false;
        if (fileExists(`${iterativePath}.json`)) {
          if (convertFreshEveryRun) {
            console.info(`Found existing ${iterativeLabel}.json, but "convertFreshEveryRun" is true, so will wipe and re-convert.`);
            
            // Wipe existing Level.sav.json
            deleteFileSync(`${iterativePath}.json`);

            runConversion = true;
          } else {
            console.info(`${iterativeLabel} has already been converted to JSON, so using that as base. If this is not desired, set "convertFreshEveryRun" to true in config.json, or remove the existing ${iterativeLabel}.json file.`)
          }
        } else {
          console.info(`Looks like we need to convert ${iterativeLabel} to JSON.`);
          runConversion = true;
        }

        if (runConversion) {
          const [isLevelConversionSuccessful, levelConversionErrors] = await convertSavAndJson(savJsonRelativeInstallPath, iterativePath, iterativeLabel);
          if (isLevelConversionSuccessful) {
            console.info(`Thanks, CheahJS! Looks like conversion was successful.`);
          } else {
            errors.push(...levelConversionErrors);
          }
        }

        try {
          if (errors.length < 1) {
            const levelSavRawJsonData = fs.readFileSync(`${iterativePath}.json`);
            levelSavJson = JSON.parse(levelSavRawJsonData);
            if (levelSavJson && levelSavJson.header.magic) {
              console.info(`Loaded ${iterativeLabel} into memory. You should see a magic value here: ${levelSavJson.header.magic}`)
            }
          }
        } catch (err) {
          errors.push(`Error loading converted ${iterativeLabel} into memory, see logs.`)
          console.error(`Error loading converted ${iterativeLabel} into memory: ${err.message}`);
        }
      } else {
        console.error(`Unable to find ${iterativeLabel}! World modifications and some changes to player data, such as level, cannot be completed!`);
      }

      // Handle LevelMeta.sav
      iterativeLabel = 'LabelMeta.sav';
      iterativePath = levelMetaSavPath;
      if (fileExists(iterativePath)) {
        console.info(`Found ${iterativeLabel}, checking for existing converted JSON:`)

        let runConversion = false;
        if (fileExists(`${iterativePath}.json`)) {
          if (convertFreshEveryRun) {
            console.info(`Found existing ${iterativeLabel}.json, but "convertFreshEveryRun" is true, so will wipe and re-convert.`);
            
            // Wipe existing Level.sav.json
            deleteFileSync(`${iterativePath}.json`);

            runConversion = true;
          } else {
            console.info(`${iterativeLabel} has already been converted to JSON, so using that as base. If this is not desired, set "convertFreshEveryRun" to true in config.json, or remove the existing ${iterativeLabel}.json file.`)
          }
        } else {
          console.info(`Looks like we need to convert ${iterativeLabel} to JSON.`);
          runConversion = true;
        }

        if (runConversion) {
          const [isLevelMetaConversionSuccessful, levelMetaConversionErrors] = await convertSavAndJson(savJsonRelativeInstallPath, iterativePath, iterativeLabel);
          if (isLevelMetaConversionSuccessful) {
            console.info(`Thanks, CheahJS! Looks like conversion was successful.`);
          } else {
            errors.push(...levelMetaConversionErrors);
          }
        }

        try {
          const levelMetaSavRawJsonData = fs.readFileSync(`${iterativePath}.json`);
          levelSavMetaJson = JSON.parse(levelMetaSavRawJsonData);
          if (levelSavMetaJson && levelSavMetaJson.header.magic) {
            console.info(`Loaded ${iterativeLabel} into memory. You should see a magic value here: ${levelSavMetaJson.header.magic}`)
          }
        } catch (err) {
          errors.push(`Error loading converted ${iterativeLabel} into memory, see logs.`)
          console.error(`Error loading converted ${iterativeLabel} into memory: ${err.message}`);
        }
      } else {
        console.warn(`Unable to find ${iterativeLabel}! This file normally holds player base information. This is not currently needed or modified by this tool, but such functionality may be supported in the future and generally one would expect to find this file in the save directory.`);
      }
    } catch (err) {
      errors.push('Error during world save check & conversion, see logs.')
      console.error(`Error during world conversion stage: ${err.message}`);
    }
  }

  if (!levelSavJson || !levelSavJson.header.magic) {
    errors.push('In-memory Level.sav seems to be missing or incomplete. We use this to update world and player data, so we will not continue without it.');
  }

  if (errors.length < 1) {
    /**
     * First, let's grab some basic save file metadata that might just be helpful to know.
     */
    const {
      magic,
      save_game_version,
      engine_version_major,
      engine_version_minor,
      engine_version_patch,
      engine_version_branch
    } = levelSavJson.header;

    // This should be an array of objects, each of which contains some general player data like level, handle, etc.
    const worldPlayerData = levelSavJson.properties.worldSaveData.value.CharacterSaveParameterMap.value;

    const quickStats = {
      magic,
      saveGameVersion: save_game_version,
      engineVersion: `${engine_version_major}.${engine_version_minor}.${engine_version_patch} (${engine_version_branch})`,
      countTotalPlayers: worldPlayerData?.length || 'Could not find player data'
    }
    
    console.info(`Here's a quick summary of your world save:`, quickStats);

    // Now let's grab all of requested player changes and 
    const { changesToMake } = appConfig;
    if (!changesToMake) {
      console.info(`Your config file doesn't list any changes to make, so none will be attempted.`)
      return;
    }
  }

  if (errors.length > 0) {
    console.error('One or more errors were found during run:', errors)
  }
}

// Rawr
saveEditorMain();
