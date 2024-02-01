// Require necessary core
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const appPackage = require('./package.json'); // Grab version data
const execAsync = promisify(exec);
require('dotenv').config()
var argv = require('minimist')(process.argv.slice(2));

// Require necessary libs
const fileExists = require('./lib/fileExists');
const cloneGitRepo = require('./lib/cloneGitRepo');
const getAppConfig = require('./lib/getAppConfig');
const deleteFileSync = require('./lib/deleteFileSync');
const convertSavAndJson = require('./lib/convertSavAndJson');
const filenameCompatibleTimestamp = require('./lib/filenameCompatibleTimestamp');
const promptToClose = require('./lib/promptToClose');
const normalizeGuid = require('./lib/normalizeGuid');
const { updatePlayerLevelSavData, updatePlayerPersonalSaveData } = require('./lib/playerDataUpdates');
const writeJsonFile = require('./lib/writeJsonFile');

const attributeToCheahJs = 'Thanks much, @cheajs!';
const successfulConversion = `${attributeToCheahJs} Looks like conversion was successful.`;

// Main saveEditor
async function saveEditorMain() {
  let errors = [];
  const appStartedTimestamp = new Date().toISOString();
  const reportData = {
    summary: {},
    players: [],
    changelog: [],
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
  let playerRawSavJsonByGuid = {}; // This will be a map of player GUIDs to their converted save files.
  let refinedPlayerMap = []; // This will be a refined version of the Players list that we assemble
  let changesMade = [];
  /**
   * Placeholder for `levelSavJson.properties.worldSaveData.value.CharacterSaveParameterMap.value`
   */
  let worldPlayerData = null;

  const {
    gameSaveDirectoryPath,
    savToJsonConversion = {
      enable: true,
      relativeInstallPath: './palworld-save-tools-cheahjs',
      repoUrl: 'https://github.com/cheahjs/palworld-save-tools.git',
      convertFreshEveryRun: true,
      cleanUpJsonAfterConversion: true,
    },
  } = appConfig;

  const {
    enable: enableSavJsonConversion,
    relativeInstallPath: savJsonRelativeInstallPath,
    repoUrl: savJsonRepoUrl,
    convertFreshEveryRun,
    cleanUpJsonAfterConversion,
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
    worldPlayerData = levelSavJson.properties.worldSaveData.value.CharacterSaveParameterMap.value;

    // Will hold a modified version of worldPlayerData, if we make any changes to it.
    modifiedWorldPlayerData = worldPlayerData;


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
      const capturedPalsByGuid = {};

      let iteratedPlayerIndex = 0;
      for (const singleRawPlayer of worldPlayerData) {
        let refinedSinglePlayer = {};
        const nestedPlayerData = singleRawPlayer?.value?.RawData?.value?.object?.SaveParameter?.value;

        // Before continuing, make sure this is actually a player. Otherwise, it's a Pal owned by a player
        if (
          normalizeGuid(singleRawPlayer?.key?.PlayerUId?.value) === '00000000000000000000000000000000' &&
          nestedPlayerData?.CharacterID?.value && nestedPlayerData?.CharacterID?.value?.length > 0
        ) {
          // This is a Pal, not a player. Add it to our map of captured Pals.
          if (process.env.DEBUG) {
            console.info("Found a Pal Reference, skipping. This is probably a Pal owned by a player - a future update will include this data and likely make it editable!");
          }
          continue;
        }

        refinedSinglePlayer = {
          guid: singleRawPlayer?.key?.PlayerUId?.value || 'N/A',
          levelSavPlayerIndex: iteratedPlayerIndex,
        }

        // Determine expected save file name based on GUID
        if (refinedSinglePlayer.guid !== 'N/A') {
          refinedSinglePlayer.expectedSaveFileName = `${normalizeGuid(refinedSinglePlayer.guid)}.sav`;
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
                  
                  // Add the full raw to our playerRawSavJsonByGuid map.
                  // Later, we'll modify this data directly then write back to the SAV.json on disk
                  playerRawSavJsonByGuid[refinedSinglePlayer.guid] = thisPlayerSavParsedJsonData;

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

      // if (appConfig?.reporting?.showPlayerData !== false) {
      //   console.info('\n\n===========================')
      //   console.info(`Data on all of your current players`, refinedPlayerMap);
      //   console.info('===========================')

      //   console.info(`Pro Tip: Almost any values you see above (except fields with "total" in the name) can be modified! Just add them to the "changesToMake" section in your config file!\n\n`)
      // }
    }
  }
  /**
   * Handle any requested changes from the `changesToMake` section of config.json
   * We will index based on GUID or name, depending on what's provided.
   * If no GUID, we will make sure only one user has the given name before making changes.
   * In such a case (multiple players w/ same name), we will note to user and make no changes until they add a GUID.
   */
  if (errors.length < 1) {
    const { changesToMake = null } = appConfig;
    if (changesToMake) {
      console.info("Attempting to make the changes you've requested...")

      // We don't support any world changes yet, so ignore this section for now
      if (changesToMake?.world) {
        console.info("FYI: You specified a `world` section in `changesToMake`, but no world changes are currently supported. `world` will be ignored for now, but there may support for this in the future.")
      }

      // Make sure we have players to work with
      if (!changesToMake?.players || !Array.isArray(changesToMake?.players) || changesToMake?.players?.length < 1) {
        console.info("The `players` section of `changesToMake` is empty, invalid (not an array), or not present at all, so no player changes will be attempted.")
      } else {
        let playerToModifyIndex = 0;
        for (const playerToModify of changesToMake?.players) {
          let playerLabel = '';
          if (playerToModify?.handle) {
            playerLabel = `"${playerToModify?.handle}"`;
          }
          if (playerToModify?.guid) {
            playerLabel = `${playerLabel.trim()} with GUID "${playerToModify?.guid}"`;
          }
          if (playerLabel?.length < 1) {
            playerLabel = `at index ${playerToModifyIndex}`
          }
          console.info(`Looking at changes needed for player ${playerLabel}.`);

          const findPlayerByGuid = refinedPlayerMap.filter((player) => normalizeGuid(player?.guid) === normalizeGuid(playerToModify?.guid));

          let foundPlayer = null;

          if (findPlayerByGuid?.length === 1) {
            console.info(`Found player by GUID (${findPlayerByGuid[0]?.guid}), so we'll use that.`)
            foundPlayer = findPlayerByGuid[0];
          } else if (findPlayerByGuid?.length > 1) {
            console.info(`Found multiple players with GUID (${findPlayerByGuid[0]?.guid}). Because this is indeterminate, for now (for safety) we won't make any modifications to this player. This normally shouldn't happen, so it might be a sign of potential weirdness with your saves!`)
            foundPlayer = true;
            continue;
          }

          if (!foundPlayer && playerToModify?.handle) {
            const findPlayerByHandle = refinedPlayerMap.filter((player) => player?.handle?.toLowerCase() === playerToModify?.handle?.toLowerCase());
            if (findPlayerByHandle?.length > 1) {
              console.info(`Found multiple players with handle (${findPlayerByHandle[0]?.handle}). Because this is indeterminate, for now (for safety) we won't make any modifications to this player. This normally shouldn't happen, so it might be a sign of potential weirdness with your saves!`)
              foundPlayer = findPlayerByHandle[0];
              continue;
            } else if (findPlayerByHandle?.length === 1) {
              console.info(`Found one player by handle ("${findPlayerByHandle[0]?.handle}"), so we'll use that.`)
              foundPlayer = findPlayerByHandle[0];
            } else if (findPlayerByHandle?.length < 1) {
              console.info(`Unable to find player with handle ("${playerToModify.handle}"). Try adding a GUID to your config.json instead.`)
            }
          }

          if (foundPlayer) {
            console.info(`Found player ("${foundPlayer.handle}", GUID ${foundPlayer.guid}) to modify.`)

            // Get relevant world data for this player
            const targetPlayerLevelSavJson = worldPlayerData?.[foundPlayer.levelSavPlayerIndex]?.value?.RawData?.value?.object?.SaveParameter?.value;

            // Make Level.sav changes for this player
            const [updatedPlayerLevelSavJson, levelSavJsonChangelog, levelSavJsonErrors] =
              updatePlayerLevelSavData(
                targetPlayerLevelSavJson,
                playerToModify,
                foundPlayer.guid || foundPlayer.handle
              );

            if (appConfig?.reporting?.showChangesMade) {
              reportData.changelog = [...reportData.changelog, ...levelSavJsonChangelog];
            }
            
            if (levelSavJsonErrors.length > 0) {
              console.error(`Ran into ${levelSavJsonErrors.length} errors modifying this user!. Out of an abundance of caution, no changes for this user will be written into your save file! Check your errors in logs or report for details.`);

              errors = [...errors, ...levelSavJsonErrors];
            } else {
              // Now let's go commit those changes!
              console.info(`Staging changes to Level.sav.json for player "${foundPlayer.handle}" (GUID ${foundPlayer.guid})...`)
              modifiedWorldPlayerData[foundPlayer.levelSavPlayerIndex].value.RawData.value.object.SaveParameter.value = {
                ...updatedPlayerLevelSavJson,
              };
            }

            // Get relevant player save (Players/XXX.sav) for this player
            const targetPlayerSaveJson =
              playerRawSavJsonByGuid[foundPlayer.guid]?.properties?.SaveData?.value;

            const [updatedSavJson, playerSavJsonChangelog, playerSavJsonErrors] = updatePlayerPersonalSaveData(
              targetPlayerSaveJson,
              playerToModify,
              foundPlayer.guid || foundPlayer.handle
            );

            if (appConfig?.reporting?.showChangesMade) {
              reportData.changelog = [...reportData.changelog, ...playerSavJsonChangelog];
            }

            if (playerSavJsonErrors.length > 0) {
              console.error(`Ran into ${playerSavJsonErrors.length} errors modifying this user!. Out of an abundance of caution, no changes for this user will be written into your save file! Check your errors in logs or report for details.`);
              errors = [...errors, ...playerSavJsonErrors.errors];
            } else {
              // Now let's go commit those changes!
              console.info(`Staging changes to Players/${normalizeGuid(foundPlayer.guid)}.sav.json for player "${foundPlayer.handle}"...`)

              if (appConfig?.removeAttribution !== true) {
                const toolsUsed = [`adefee/palworld-save-editor@v${appPackage.version}`];
                if (appConfig?.savToJsonConversion?.enable) toolsUsed.push('cheahjs/palworld-save-tools');
                playerRawSavJsonByGuid[foundPlayer.guid].header.save_edited = {
                  lastEdited: new Date().toISOString(),
                  toolsUsed,
                }
              }

              // Update entry.
              playerRawSavJsonByGuid[foundPlayer.guid].properties.SaveData.value = {
                ...updatedSavJson,
              }

              // Write to disk!t
              const targetPlayerSavJson = `${gameSaveDirectoryPath}/Players/${normalizeGuid(foundPlayer.guid)}.sav.json`;
              const targetPlayerSavPath = `${gameSaveDirectoryPath}/Players/${normalizeGuid(foundPlayer.guid)}.sav`;
              writeJsonFile(targetPlayerSavJson, playerRawSavJsonByGuid[foundPlayer.guid]);

              // Delete target sav if exists; CheahJS' tool won't overwrite if exists.
              if (fileExists(targetPlayerSavPath)) {
                deleteFileSync(`${targetPlayerSavPath}`);
              }

              // Convert it back into SAV
              await convertSavAndJson(savJsonRelativeInstallPath, targetPlayerSavJson, `Players/${normalizeGuid(foundPlayer.guid)}.sav.json`);

              // Cleanup old JSON
              if (cleanUpJsonAfterConversion != false) {
                deleteFileSync(`${targetPlayerSavJson}`);
              }
            }
          }

          playerToModifyIndex++;
        }

        // Now that we've iterated through all players, let's write the changes to disk.
        if (errors.length > 0) {
          console.error(`Skipping final write step to Level.sav.json due to ${errors.length} errors. See logs/report for details.`);
        } else {

          // TODO: Better abstract this.

          // Write relevant changes to Level.sav.json
          console.info(`Writing changes to Level.sav.json...`)
          const newLevelJsonBlobToWrite = levelSavJson;
          newLevelJsonBlobToWrite.properties.worldSaveData.value.CharacterSaveParameterMap.value = modifiedWorldPlayerData;
          if (appConfig?.removeAttribution !== true) {
            const toolsUsed = [`adefee/palworld-save-editor@v${appPackage.version}`];
            if (appConfig?.savToJsonConversion?.enable) toolsUsed.push('cheahjs/palworld-save-tools');
            newLevelJsonBlobToWrite.header.save_edited = {
              lastEdited: new Date().toISOString(),
              toolsUsed,
            }
          }

          // Write to disk!
          const targetLevelSavJsonPath = `${gameSaveDirectoryPath}/Level.sav.json`;
          const targetLevelSavPath = `${gameSaveDirectoryPath}/Level.sav`;
          writeJsonFile(targetLevelSavJsonPath, newLevelJsonBlobToWrite);

          // Delete target sav if exists; CheahJS' tool won't overwrite if exists.
          if (fileExists(targetLevelSavPath)) {
            deleteFileSync(`${targetLevelSavPath}`);
          }

          // Convert it back into SAV
          await convertSavAndJson(savJsonRelativeInstallPath, targetLevelSavJsonPath, 'Level.sav.json');

          // Cleanup old JSON
          if (cleanUpJsonAfterConversion != false) {
            deleteFileSync(`${targetLevelSavJsonPath}`);
          }

        }
      }
      

      console.info('Any relevant changes to be made have now been completd.')
    } else {
      console.info("No changes were requested (via `changesToMake` in your config), so none will be attempted.")
    }
  }

  /**
   * Export report as needed or if reporting isn't specified
   */
  if (errors.length < 1) {
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
  }

  /**
   * Print out any errors we've hit along the way.
   */
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
