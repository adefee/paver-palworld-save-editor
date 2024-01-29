// Require necessary core
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const execAsync = promisify(exec);
require('dotenv').config()
var argv = require('minimist')(process.argv.slice(2));

// Require necessary libs
const fileExists = require('./lib/fileExists');
const cloneGitRepo = require('./lib/cloneGitRepo');
const getAppConfig = require('./lib/getAppConfig');
const deleteFileSync = require('./lib/deleteFile');
const convertSavAndJson = require('./lib/convertSavAndJson');
const filenameCompatibleTimestamp = require('./lib/filenameCompatibleTimestamp');
const promptToClose = require('./lib/promptToClose');

const attributeToCheahJs = 'Thanks much, @cheajs!';
const successfulConversion = `${attributeToCheahJs} Looks like conversion was successful.`;

// Main saveEditor
async function saveEditorMain() {
  const errors = [];
  const appStartedTimestamp = new Date().toISOString();
  const reportData = {
    summary: {},
    players: [],
  };

  if (!argv || !argv['c']) {
    console.info("Using default config.json path of './config.json'. If you want to use a different path, use the '-c' flag");
  }

  const appConfig = getAppConfig(argv && argv['c'] ? argv['c'] : './config.json');

  if (!appConfig) {
    errors.push('Unable to load app config, so cannot continue');
    console.err('Unable to load app config, so cannot continue. See README.md to learn about config.json and how to create it.')
  }

  if (!appConfig?.gameSaveDirectoryPath || appConfig?.gameSaveDirectoryPath?.length < 1) {
    errors.push('Unable to find gameSaveDirectoryPath in config.json, so we cannot continue.');
    console.error('The only required field in config.json is gameSaveDirectoryPath, which should be the path to a valid Palworld save directory. This field is missing or empty. See README.md for more info.');
  }

  if (errors.length > 0) {
    await promptToClose();
    process.exit(1);
  }

  // Setup placeholders for converted save data.
  let levelSavJson = null; // This will be the converted Level.sav file, if it exists.
  let levelSavMetaJson = null; // This will be the converted LevelMeta.sav file, if it exists.
  let refinedPlayerMap = []; // This will be a refined version of the Players list that we assemble

  const {
    gameSaveDirectoryPath,
    savToJsonConversion = {
      enable: true,
      relativeInstallPath: './palworld-save-tools-cheahjs',
      repoUrl: 'https://github.com/cheahjs/palworld-save-tools.git',
      convertFreshEveryRun: true,
    },
  } = appConfig;

  const {
    enable: enableSavJsonConversion,
    relativeInstallPath: savJsonRelativeInstallPath,
    repoUrl: savJsonRepoUrl,
    convertFreshEveryRun,
  } = savToJsonConversion;

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
            console.info(`${successfulConversion}`);
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
            console.info(`${successfulConversion}`);
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

    reportData.summary = {
      magic,
      saveGameVersion: save_game_version,
      engineVersion: `${engine_version_major}.${engine_version_minor}.${engine_version_patch} (${engine_version_branch})`,
      countTotalPlayers: worldPlayerData?.length || 'Could not find player data'
    }
    
    console.info('\n\n===========================')
    console.info(`Here's a quick summary of your world save:`, reportData.summary);
    console.info('===========================\n\n')

    /**
     * Before we continue, we can do some validation.
     * For exmaple, we'd expect to find one save file per player entry.
     */
    if (worldPlayerData.length < 1) {
      errors.push('No player data found in Level.sav, so we cannot continue.');
    }

    if (errors.length < 1) {
      let iteratedPlayerIndex = 0;
      for (const singleRawPlayer of worldPlayerData) {
        let refinedSinglePlayer = {};
        const nestedPlayerData = singleRawPlayer?.value?.RawData?.value?.object?.SaveParameter?.value;
        refinedSinglePlayer = {
          guid: singleRawPlayer?.key?.PlayerUId?.value || 'N/A',
        }

        // Determine expected save file name based on GUID
        if (refinedSinglePlayer.guid !== 'N/A') {
          refinedSinglePlayer.expectedSaveFileName = `${refinedSinglePlayer.guid?.replace(/-/g, '').toUpperCase()}.sav`;
        } else {
          errors.push(`The player at index ${iteratedPlayerIndex} does not have a valid GUID, so we cannot determine their save file name. This may indicate an incomplete or corrupted player record. No modifications will attempt to be made to this player!`)
        }

        if (nestedPlayerData) {
          // Default to level 1 if we can't find it. This entry may not exist if we haven't dinged yet.
          refinedSinglePlayer.level = nestedPlayerData?.Level?.value || 1; 
          // Default to 0 if we can't find it. This entry may not exist if we haven't earned any xp yet (fresh install)
          refinedSinglePlayer.exp = nestedPlayerData?.Exp?.value || 0;
          // This is our nickname, etc. Case-sensitive.
          refinedSinglePlayer.handle = nestedPlayerData?.NickName?.value || null;
          // Yes, the value.value.value, etc is intentional. These are heavily nested.
          refinedSinglePlayer.currentHp = nestedPlayerData?.HP?.value?.Value?.value || null;
          refinedSinglePlayer.maxHp = nestedPlayerData?.MaxHP?.value?.Value?.value || null;
          // Not as nested as the above.
          refinedSinglePlayer.hunger = nestedPlayerData?.FullStomach?.value || null;
          
          /**
           * Attempt to load the save file
           */
          try {
            if (refinedSinglePlayer.expectedSaveFileName) {
              let runPlayerSaveFileConversion = false;
              const thisPlayerSaveFilePath = `${gameSaveDirectoryPath}/Players/${refinedSinglePlayer.expectedSaveFileName}`;
              if (fileExists(`${thisPlayerSaveFilePath}.json`)) {
                console.info(`Found existing JSON version of ${refinedSinglePlayer.handle}'s save file.`);
                if (convertFreshEveryRun) {              
                  // Wipe existing Players/<GUID>.json
                  deleteFileSync(`${thisPlayerSaveFilePath}.json`);
                  runPlayerSaveFileConversion = true;
                }
              } else {
                runPlayerSaveFileConversion = true;
              }

              if (runPlayerSaveFileConversion) {
                console.info(`Converting ${refinedSinglePlayer.handle}'s save file to JSON.`);
                const [isPlayerConversionSuccessful, playerConversionErrors] = await convertSavAndJson(savJsonRelativeInstallPath, thisPlayerSaveFilePath, `${refinedSinglePlayer.handle || refinedSinglePlayer.guid}`);
                if (isPlayerConversionSuccessful) {
                  console.info(`${successfulConversion}`);
                } else {
                  errors.push(...playerConversionErrors);
                }
              } else {
                console.info(`Looks like we already have a JSON version of ${refinedSinglePlayer.handle}'s save file, so we'll use that.`);
              }

              try {
                const thisPlayerSavRawJsonData = fs.readFileSync(`${thisPlayerSaveFilePath}.json`);
                const thisPlayerSavParsedJsonData = JSON.parse(thisPlayerSavRawJsonData);
                if (thisPlayerSavParsedJsonData) {
                  
                  /**
                   * Player file has some stuff the Level.sav doesn't have.
                   * For example, TechnologyPoints, UnlockedRecipeTechnologyNames, and PlayerCharacterMakeData (appearance) data.
                   * There's some overlap, though - like the voiceID, which is in both.
                   */
                  const playerFileNestedData = thisPlayerSavParsedJsonData?.properties?.SaveData?.value || null;
                  if (!playerFileNestedData) {
                    errors.push(`Unable to find expected data (tech points, appearance, etc) for player with GUID: "${refinedSinglePlayer.guid}". This may indicate an incomplete or corrupted player record.`);
                  } else {
                    console.info("Found player save data, loading...");

                    // This object may not exist if player hasn't levelled yet, so default to 0
                    refinedSinglePlayer.totalTechnologyPoints = playerFileNestedData?.TechnologyPoint?.value || 0;
                    refinedSinglePlayer.totalAncientTechnologyPoints = playerFileNestedData?.bossTechnologyPoint?.value || 0;

                    if (appConfig?.reporting?.showPlayerUnlockedRecipes !== false) {
                      refinedSinglePlayer.unlockedRecipes = playerFileNestedData?.UnlockedRecipeTechnologyNames?.value?.values ? playerFileNestedData?.UnlockedRecipeTechnologyNames?.value?.values : [];
                    }

                    if (appConfig?.reporting?.showPlayerAppearance !== false) {
                      if (!playerFileNestedData?.PlayerCharacterMakeData?.value) {
                        refinedSinglePlayer.appearance = {
                          error: 'Unable to find PlayerCharacterMakeData for this player.'
                        };
                        errors.push(`Unable to find PlayerCharacterMakeData for player with GUID: "${refinedSinglePlayer.guid}". This may indicate an incomplete or corrupted player record.`);
                      } else {
                        refinedSinglePlayer.appearance = {};
                        const appearanceKeys = [
                          'BodyMeshName',
                          'HeadMeshName',
                          'HairMeshName',
                          'HairColor',
                          'BrowColor',
                          'BodyColor',
                          'BodySubsurfaceColor',
                          'EyeColor',
                          'EyeMaterialName',
                          'VoiceID'
                        ]
                        for (const thisAppearanceKey of appearanceKeys) {
                          if (playerFileNestedData?.PlayerCharacterMakeData?.value?.[`${thisAppearanceKey}`]?.value) {
                            try {
                              const thisCurrentValue = playerFileNestedData?.PlayerCharacterMakeData?.value?.[`${thisAppearanceKey}`]?.value;
                              if (thisCurrentValue) {
                                if (typeof thisCurrentValue === 'string') {
                                  refinedSinglePlayer.appearance[`${thisAppearanceKey}`] = thisCurrentValue;
                                } else {
                                  refinedSinglePlayer.appearance[`${thisAppearanceKey}`] = JSON.stringify(thisCurrentValue);
                                }
                              } else {
                                refinedSinglePlayer.appearance[`${thisAppearanceKey}`] = null;
                              }
                            } catch (err) {
                              // ignore for now
                              console.error(`Error stringifying appearance key ${thisAppearanceKey}: ${err.message}`)
                            }
                          } else {
                            console.info('Unable to find key', `playerFileNestedData?.PlayerCharacterMakeData?.value?.[${thisAppearanceKey}]?.value`)
                          }
                        }
                      }
                    }

                    const playerRecordData = playerFileNestedData?.RecordData?.value || null;
                    if (playerRecordData) {
                      refinedSinglePlayer.countTribesDefeated = playerRecordData?.TribeCaptureCount?.value || 0;
                      refinedSinglePlayer.countEffigiesFound = playerRecordData?.RelicPossessNum?.value || 0;

                      // Some quick totals
                      refinedSinglePlayer.countTotalPetCaptures = playerRecordData?.PalCaptureCount?.value.reduce((accumulator, current) => (accumulator + current.value), 0) || 0;
                      refinedSinglePlayer.countTotalUnlockedFastTravels = playerRecordData?.FastTravelPointUnlockFlag?.value?.length || 0;
                      refinedSinglePlayer.countTotalNotesFound = playerRecordData?.NoteObtainForInstanceFlag?.value?.length || 0;

                      // List captured Pals
                      if (appConfig?.reporting?.showCapturedPals !== false) {
                        refinedSinglePlayer.palsCaptured = playerRecordData?.PalCaptureCount?.value || [];
                      }
                    }
                  }

                } else {
                  errors.push(`Error loading ${refinedSinglePlayer.handle}'s converted save file into memory`);
                }

              } catch (err) {
                errors.push(`Error loading ${refinedSinglePlayer.handle}'s converted save file into memory, see logs.`)
                console.error(`Error loading ${refinedSinglePlayer.handle}'s converted save file into memory: ${err.message}`);
              }
            }
            
          } catch (err) {
            console.error(`Error converting save file for player: ${refinedSinglePlayer.handle || refinedSinglePlayer.guid}`, err)
            errors.push(`Error converting save file for player: ${refinedSinglePlayer.handle || refinedSinglePlayer.guid}`)
          }

          // Add the player to our refined player map
          refinedPlayerMap.push(refinedSinglePlayer);
          iteratedPlayerIndex++; // Bump our index

        } else {
          errors.push(`Unable to find nested player data (handle, level, etc) for player with GUID: "${refinedSinglePlayer.guid}". This may indicate an incomplete or corrupted player record.`)
        }

        reportData.players = refinedPlayerMap;
      }

      if (appConfig?.reporting?.showPlayerData !== false) {
        console.info('\n\n===========================')
        console.info(`Data on all of your current players`, refinedPlayerMap);
        console.info('===========================')

        console.info(`Pro Tip: Almost any values you see above (except fields with "total" in the name) can be modified! Just add them to the "changesToMake" section in your config file!\n\n`)
      }
    }
    
    /**
     * If we are this far, we're now ready to start attempting to make changes.
     */
    const { changesToMake } = appConfig;
    if (!changesToMake) {
      console.info(`Your config file doesn't list any changes to make, so none will be attempted. The app will only generate a report.`);
    }

    /**
     * Export report as needed or if reporting isn't specified
     */
    if (appConfig?.reporting?.export !== false) {
      console.info("Exporting report as JSON...")
      try {

        // Add generation timestmap to report
        reportData.summary.reportStartedAt = appStartedTimestamp;
        reportData.summary.reportExportedAt = new Date().toISOString();

        let outputFilePath = `./reports/${filenameCompatibleTimestamp()}.json`;
        // If we have a path given, use that instead
        if (appConfig?.reporting?.exportPath && appConfig?.reporting?.exportPath?.endsWith('.json')) {
          console.info("exportPath was given and looks like a filename, so we'll use that.")
          outputFilePath = appConfig?.reporting?.exportPath;
        } else if (appConfig?.reporting?.exportPath) {
          // Treat it as a directory
          console.info('exportPath was given without a .json extension, so we will treat it as a directory and use a timestamp.json filename.')
          outputFilePath = `${appConfig?.reporting?.exportPath}/${filenameCompatibleTimestamp()}.json`;
        }

        const exportReportDir = path.dirname(outputFilePath);
        fs.mkdirSync(exportReportDir, { recursive: true });

        const finalReportData = {
          ...reportData,
        }

        // Just easier to do this check here than earlier
        // Exclude player data if we've explicitly declared showPlayerData as false
        if (appConfig?.reporting?.showPlayerData === false) {
          finalReportData.players = undefined;
        }

        fs.writeFileSync(outputFilePath, JSON.stringify(finalReportData, null, 2), 'utf8');
        console.log(`Report written written to ${outputFilePath}`);
      } catch (error) {
        console.error(`Error writing to file: ${error.message}`);
      }
    }

    // TODO: Iterate over each of our changes and apply based on what we need.
  }

  if (errors.length > 0) {
    console.info('\n\n===========================')
    console.error('One or more errors were found during run:', errors)
    console.info('===========================\n\n')
  }

  console.info('\n\n===========================')
  console.info('Application has finished running');

  await promptToClose();
}

// Rawr
saveEditorMain();
