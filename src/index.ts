// Require necessary core
const fs = require('fs');

import { promisify } from 'util';
import { Transform, pipeline } from 'stream';
import { exec } from 'child_process';
const execAsync = promisify(exec);
var argv = process.argv.slice(2);
const pipelineAsync = promisify(pipeline);

// Require necessary libs
import filenameCompatibleTimestamp from './lib/filenameCompatibleTimestamp';
import writeJsonFile from './lib/writeJsonFile';

const attributeToCheahJs = 'Thanks much, @cheajs!';
const successfulConversion = `${attributeToCheahJs} Looks like conversion was successful.`;


import JSONStream from 'JSONStream';
import * as Child from 'child_process';
import { ensureDirectoryExists, ensureFileExists } from './lib/ensureDirectoryExists';
import { ISaveAsJson, ISaveAsJsonHeader, ISaveAsJsonProperties, ISaveAsJsonTrailer } from './types/SaveAsJson';
import { IChangelogEntry, IPaverConfig } from './types/Paver';
import normalizeGuid from './lib/normalizeGuid';
import promptToClose from './lib/promptToClose';
import { editPlayerInLevelSav, editPlayerSav } from './lib/write/editPlayer';
import convertSavAndJson from './lib/convertSavAndJson';
import { skip } from 'node:test';
import downloadAndExtractCheahJsZip from './lib/downloadAndExtractZip';
import deleteFileSync from './lib/deleteFileSync';

// var DepthStream = require('json-depth-stream')
// var zlib = require('zlib')

const saveEditorMain = async () => {
  console.info('Starting Paver Save Editor...');

  // Track errors, warnings, changelogs
  let criticalErrors = [];
  let warnings = [];
  let changelog: IChangelogEntry[] = [];
  let targetGameSaveDirectoryPath = null; // This is the directory where the game's save files (and JSON) should be located
  let levelSavJsonPath = null; // This will be set to the path of the Level.sav.json file, once available
  let isMissingCharSaveMap = false; // If we have no players (e.g. fresh save), avoid player iteration

  // Track config and optional arguments
  const appArguments: {
    config?: string,
  } = {};
  argv.forEach((arg) => {
    const [key, value] = arg.split('=');
    appArguments[key] = value;
  });

  // This will hold our config data.
  let appConfig = null;

  // Set some other important defaults.
  // Make this configurable in the future.
  const runtimeStamp = filenameCompatibleTimestamp();
  const internalOutputPath = appConfig?.useCustomDataStorePath || `./datastore/${runtimeStamp}`;
  const levelSavJsonModifiedPath = `${internalOutputPath}/Level.sav.json`;

  // Based on `gameSaveDirectoryPath`, are we able to find any Player sav files?
  // Some options (like appearance) may not be available if we can't find any player sav files.
  const arePlayerSaveFilesFound = false; 

  // As we stream over level.sav, we will fill this out. This gets used after our level.sav stream when we iterate over individual player sav files in /Players
  const listOfPlayerSavsToModify: {
    guid: string,
    handle: string,
    changesToMake: IPaverConfig['changesToMake']['players'][0]
  }[] = []

  // Before anything else, make sure we have our two dependencies:
  // 1. Python
  // 2. config.json
  // 3. (if converting), CheahJS' save tools

  try {
    // Check for Python
    console.info("Checking to make sure Python is installed and available...")

    const {
      stdout: pythonVersion,
      stderr: pythonInstallError 
    } = await execAsync('python --version');
    if (pythonInstallError) {
      criticalErrors.push('Python is not installed or not in your PATH. Paver requires Python to run. Please install Python and ensure it is in your PATH.');
    } else {
      console.info(`Found Python, you should see a version here: ${pythonVersion}`);
    }
  } catch (err) {
    criticalErrors.push(`Critical error encountered when checking for Python installation: Python is required for Paver to work. ${err}`)
    console.error('Issue when checking to make sure Python is installed!', err);
  }

  try {
    // Check for config.json
    console.info("Checking to make sure a config.json exists...")
    let configLocation = appArguments?.config || './config.json';

    if (!fs.existsSync(configLocation)) {
      // File does not exist, so create it
      fs.writeFileSync(configLocation, JSON.stringify({
        gameSaveDirectoryPath: '<path to your game save directory>',
        changesToMake: {
          enableGuardrails: true,
          players: [
            {
              "handle": "<your handle>",
              "level": 42,
              "ancientTechPoints": 42
            }
          ]
        }
      }, null, 2));
      criticalErrors.push(`A config file was not found at "${configLocation}". We've created a default one for you. Please update this file with your game save directory and any changes you'd like to make, then re-run Paver.`);

    } else {
      // Make sure config file isn't just our dummy content
      try {
        const configContents = fs.readFileSync(configLocation, 'utf8');
        appConfig = JSON.parse(configContents);
      } catch (err) {
        criticalErrors.push(`Critical error encountered when reading config.json: ${err}`)
        console.error('Issue when reading config.json!', err);
      }

      // We have our valid config now, make sure it isn't just the dummy one we created earlier.
      if (appConfig?.gameSaveDirectoryPath === '<path to your game save directory>') {
        criticalErrors.push('Your config.json file is still using the default example content we created for you. Please update your config.json file with your game save directory. See Paver documentation for a list of all available options.');
      } else {
        console.info(`Found a valid config file at "${configLocation}", and it appears to be in working order.`);
      }
    }
  } catch (err) {
    criticalErrors.push(`Critical error encountered when checking for Python installation: Python is required for Paver to work. ${err}`)
    console.error('Issue when checking to make sure Python is installed!', err);
  }

  /**
   * Defaults to fetch releases for CheahJS's save tools
   * https://github.com/cheahjs/palworld-save-tools
   * After v0.16 when repo structure was changed, we now fetch from releases (which we should have done to start with). We now default only to locally tested versions of the save tools, in case the releases break things or change structure, etc.
   */
  let saveToolsInstallPath = appConfig?.cheahJsToolsInstallPath || './helpers/cheahjs-save-tools';
  let latestSupportedSaveToolVersion = appConfig?.cheahJsToolsVersion || '0.17.1';
  const latestSupportedSaveToolVersionUrl = appConfig?.cheahJsToolsDownloadUrl || `https://github.com/cheahjs/palworld-save-tools/releases/download/v${latestSupportedSaveToolVersion}/palworld-save-tools-windows-v${latestSupportedSaveToolVersion}.zip`;

  /**
   * Make sure the files we expect/need are present.
   * Specifically, we want to make sure a Level.sav exists.
   * If don't have Players/<GUID>.sav files, some options (like appearance) may not be available.
   */
  if (criticalErrors.length < 1) {
    /**
     * Start with gameSaveDirectoryPath
     * We *could* use a default here and try to assume a user's intention, but that's fundamentally
     * an anti-pattern to the core tenets of Paver. We want to be explicit about what we're doing, and make no
     * assumptions. If we assume a save dir and user forgets to update the config, we could end up modifying the wrong files.
     */
    if (!appConfig?.gameSaveDirectoryPath) {
      criticalErrors.push('gameSaveDirectoryPath is not set in your config file. This is the only required field for Paver. Please set this to the path of your game save directory.');
    } else {

      try {
        const {
          skipSavJsonConversion = false
        } = appConfig;

        targetGameSaveDirectoryPath = appConfig.gameSaveDirectoryPath;
        if (!fs.existsSync(targetGameSaveDirectoryPath)) {
          criticalErrors.push(`The game save directory you specified at "${targetGameSaveDirectoryPath}" does not exist. Please update your config.json file with the correct path to your game save directory.`);
        } else {
          console.info(`Found game save directory at "${targetGameSaveDirectoryPath}"`);
        }

        const doesLevelSavExist = fs.existsSync(`${targetGameSaveDirectoryPath}/Level.sav`);
        const doesLevelSavJsonExist = fs.existsSync(`${targetGameSaveDirectoryPath}/Level.sav.json`);

        /**
         * Just do some condition handling for cases where we don't have a Level.sav.json file, have skipConversion set, etc etc.
         */
        if (!doesLevelSavExist && !doesLevelSavJsonExist) {
          criticalErrors.push('Unable to find a Level.sav or Level.sav.json file in the `gameSaveDirectoryPath` you provided! Paver currently requires a Level.sav (or pre-converted Level.sav.json) to work.');
        } else if (skipSavJsonConversion && !doesLevelSavJsonExist) {
          criticalErrors.push('You have set `skipSavJsonConversion` to true, but no Level.sav.json file was found in your game save directory. Please set `savToJsonConversion.skipConversion` to false in your config.json file, or ensure that a Level.sav.json file exists in your game save directory.');
        } else if (!skipSavJsonConversion && !doesLevelSavExist) {
          if (doesLevelSavJsonExist) {
            criticalErrors.push('No Level.sav file was found in your game save directory, but Paver did find a Level.sav.json file. Please ensure that a Level.sav file exists in your game save directory, or add `skipSavJsonConversion: true` to your config if you want Paver to use the Level.sav.json instead.');
          } else {
            criticalErrors.push('No Level.sav file was found in your game save directory. Please ensure that a Level.sav file exists in your game save directory.');
          }
        }

        // We should now have either a Level.sav.json or a Level.sav file.
        if (criticalErrors.length < 1) {
          if (doesLevelSavJsonExist && skipSavJsonConversion) {
            levelSavJsonPath = `${targetGameSaveDirectoryPath}/Level.sav.json`;
          } else if (doesLevelSavExist && !skipSavJsonConversion) {
            // We need to convert the Level.sav to JSON
            console.info("Found a Level.sav file in the given directory, prepping to convert.")

            let cheahJsDownloadErrors: string[] = [];
            let haveCheahJsTools = 
              fs.existsSync(saveToolsInstallPath) &&
              fs.existsSync(`${saveToolsInstallPath}/convert.py`);

            if (!haveCheahJsTools) {
              [haveCheahJsTools, cheahJsDownloadErrors] = await downloadAndExtractCheahJsZip(
                latestSupportedSaveToolVersionUrl,
                saveToolsInstallPath,
                'convert.py'
              );
            }

            if (haveCheahJsTools) {
              try {

                if (fs.existsSync(`${targetGameSaveDirectoryPath}/Level.sav.json`)) {
                  deleteFileSync(`${targetGameSaveDirectoryPath}/Level.sav.json`);
                }

                const [
                  isLevelSavConverted,
                  levelSavConversionErrors
                ] = await convertSavAndJson(
                  saveToolsInstallPath,
                  `${targetGameSaveDirectoryPath}/Level.sav`,
                  'Level.sav'
                );

                if (isLevelSavConverted) {
                  console.info(successfulConversion);
                  levelSavJsonPath = `${targetGameSaveDirectoryPath}/Level.sav.json`;
                } else {
                  criticalErrors.push(`Unable to convert Level.sav to JSON: ${levelSavConversionErrors}`);
                }

                if (levelSavConversionErrors || cheahJsDownloadErrors) {
                  criticalErrors = [
                    ...criticalErrors,
                    ...levelSavConversionErrors || [],
                    ...cheahJsDownloadErrors || [],
                  ]
                }
              } catch (err) {
                criticalErrors.push(`Critical error encountered when converting Level.sav to JSON: ${err}`);
                console.error(`Error converting Level.sav -> JSON: ${err}`);
              }
            } else {
              criticalErrors.push(`Unable to find CheahJS' save tools at ${saveToolsInstallPath}. This prevents Paver from converting your SAV files to JSON (and back again). Please ensure that the path to the save tools is correct, and that the tools are installed.`);
            }
          }
        }
      } catch (err) {
        criticalErrors.push(`Critical error encountered when checking for Level.sav and Level.sav.json files: ${err}`)
        console.error('Issue when checking for Level.sav and Level.sav.json files!', err);
      }
    }
  }
  

  /**
   * At this point, we should have Level.sav.json and Players/<GUID>.json files.
   * Because Level.sav.json gets obnoxiously large and its objects are so large,
   * we'll stream the top level chunks and then write them to new files in /datastore/<timestamp>/.
   * These new files will include our changes. Afterwards, we run a script that iterates over the new files and inserts them into a new Level.sav.json before calling CheahJS's scripts to convert back to SAV.
   * I probably should have done this in a diff language or read the SAV directly, but doing this with JSON and within the constraints of Node specifically was appealing to me as an exercise.
   */
  if (criticalErrors.length < 1) {
    let {
      changesToMake
    } = appConfig;

    // Make sure our internal output dir exists
    ensureFileExists(levelSavJsonModifiedPath);

    // Get some stats on the Level.sav.json file
    const { size: levelJsonFilesize } = fs.statSync(levelSavJsonPath);
    const levelJsonFilesizeInMB = levelJsonFilesize / 1024 / 1024;

    // Note the datastore & settings to the user.
    console.info(`Setting up a temporary datastore at ${internalOutputPath}. Please do not modify or remove this directory until Paver has finished running.`)

    if (appConfig?.cleanUpDataStore === false) {
      console.info('This temp datastore will persist after Paver has finished running. If you wish for this to be removed, please set `cleanUpDataStore: true` in your config.json.')
    } else {
      console.info('This temp datastore will be removed ater Paver has finished running. If you wish for this to persist, please set `cleanUpDataStore: false` in your config.json.')
    }


    const sourceStream = fs.createReadStream(levelSavJsonPath);
    // const targetModifiedJsonStream = fs.createWriteStream(levelSavJsonModifiedPath);
    let parseTargetData = JSONStream.parse("*"); // Parse all top-level chunks: header, properties, trailer
    sourceStream.pipe(parseTargetData);

    /**
     * Setup our writable stream
     * What's cool about using this transform chain is that JSONStream will send us chunks as it's parsed, in the order it's parsed.
     * This means we can always expect the header to be the first chunk, and the trailer to be the last chunk.
     * The worldSaveData (in the properties, 2nd chunk) is very, very big. We can't expect to be able to just JSON.stringify() it all at once - that will only work on small saves.
     * Instead, we'll start splitting up everything in worldSaveData into separate dirs and files, and when doing so we should be able to go ahead and write in our necessary changes.
     */

    // Create our top-level transform stream. Depending on type, this will trigger different operations.
    const transformStream = new Transform({
      writableObjectMode: true,
      transform(levelSaveTopLevel, encoding, callback) {
        /**
         * Handle our header. This is written to its own file.
         */
        if (typeof levelSaveTopLevel === 'object' && 'magic' in levelSaveTopLevel) {
          console.log('Processing header...');

          // Write the Pal data to a file.
          const targetWritePath = `${internalOutputPath}/header.json`;
          ensureFileExists(targetWritePath);
          fs.writeFileSync(
            targetWritePath,
            JSON.stringify(levelSaveTopLevel, null, 2)
          );

          // If over 500MB, we'll warn the user that the next step may take some time.
          if (levelJsonFilesizeInMB > 500) {
            const displaySizeinGBOrMb = levelJsonFilesizeInMB >= 1000 ? `${(levelJsonFilesizeInMB / 1000).toFixed(2)} GB` : `${levelJsonFilesizeInMB.toFixed(2)} MB`;
            console.info(`Your Level.sav.json file is large enough (${displaySizeinGBOrMb}) that this next step may take a few moments. Other factors in your system may slow this down further, but based on size we'd expect this to complete in around ${Math.round(levelJsonFilesizeInMB / 100)} seconds. Please be patient!`)
          }
        }
        /**
         * Handle our trailer. This is typically the last chunk we'll see.
         * It's also (currently) our only string. We should probably add some better validation here,
         * in case that changes, but need bigger samplesize first.
         */
        else if (typeof levelSaveTopLevel === 'string' && levelSaveTopLevel.length === 8) {
          console.log(`Processing trailer ${levelSaveTopLevel}...`);
          console.info('Trailer processed.')
        }
        /**
         * Handle everything else (all inside of `properties` for some absurd reason)
         */
        else if (typeof levelSaveTopLevel === 'object' && (
          'Version' in levelSaveTopLevel &&
          'Timestamp' in levelSaveTopLevel &&
          'worldSaveData' in levelSaveTopLevel
        )) {
          /**
           * Our worldsave gets pretty massive, so we can't just JSON.stringify() it all at once.
           */
          const worldSaveData = levelSaveTopLevel.worldSaveData as ISaveAsJsonProperties['worldSaveData'];

          /**
           * Handle CharacterSaveParameterMap
           */
          if (worldSaveData?.value?.CharacterSaveParameterMap?.value?.length > 0) {
            // We have atleast one character entry, create a new directory and file for each.
            ensureDirectoryExists(`${internalOutputPath}/CharacterSaveParameterMap`);
          }

          const ownedPalsByPlayerId: {
            [key: string]: {
              playerId: string,
              palName: string,
              level: number
            }[]
          } = {};

          // It's possible for CharacterSaveMap to not exist, for exmaple if the save is fresh and no players have been created yet. So, if such, we'll skip player iteration.
          if (!worldSaveData?.value?.CharacterSaveParameterMap) {
            isMissingCharSaveMap = true;
            warnings.push(`No CharacterSaveParameterMap was found! This isn't common, but can happen naturally. This could be due to a fresh save, or a save with no players. Paver will not attempt to modify any player data.`);
          }

          if (!isMissingCharSaveMap) {
            const { value: playerPalList } = worldSaveData?.value?.CharacterSaveParameterMap;

            for (const rawPlayerOrPal of playerPalList) {
              const normalizedGuid = normalizeGuid(rawPlayerOrPal?.key?.PlayerUId?.value);

              if (normalizedGuid?.length < 1 || normalizedGuid.startsWith('00000000000')) {
                /**
                 * This is a Pal, not a player.
                 * We'll track whose Pal it is, and write data to file.
                 * Some of this is included in the output report.
                 */
                const { SaveParameter } = rawPlayerOrPal?.value?.RawData?.value?.object;
                const {
                  CharacterID,
                  Level,
                } = SaveParameter?.value;

                const owningPlayerGuid = normalizeGuid(SaveParameter?.value?.OwnerPlayerUId?.value);

                // Add this Pal to the list of OwnedPals.
                ownedPalsByPlayerId[normalizedGuid] = [
                  ...ownedPalsByPlayerId[normalizedGuid] || [],
                  {
                    playerId: owningPlayerGuid,
                    palName: CharacterID?.value,
                    level: Level?.value,
                  }
                ];

                // Add an index in case we have multiple pals of the same name/level owned by player.
                const countPlayerSamePalsOwned = ownedPalsByPlayerId[normalizedGuid]
                  .filter(x => x.playerId === owningPlayerGuid && x.palName === CharacterID?.value)
                  .length;

                // Write the Pal data to a file.
                const targetPalPath = `${internalOutputPath}/CharacterSaveParameterMap/Pals/${owningPlayerGuid}/${CharacterID?.value}-Level${Level?.value}-${countPlayerSamePalsOwned}.json`;
                ensureFileExists(targetPalPath);
                fs.writeFileSync(
                  targetPalPath,
                  JSON.stringify(rawPlayerOrPal, null, 2)
                );
              } else {
                /**
                 * This is a player. Determine if there are any changes we need to make to this player,
                 * and write our data to file.
                 */
                console.log('Processing player...', normalizedGuid);

                // See if there are other players with our handle
                const {
                  value: thisPlayerRawData
                } = rawPlayerOrPal?.value?.RawData?.value?.object?.SaveParameter;

                const playerChangesToMake = changesToMake?.players?.find(
                  x => normalizeGuid(x.guid) === normalizedGuid || x.handle === thisPlayerRawData?.NickName?.value
                );

                /**
                 * There are some circumstances that affect whether or not we'll modify a given user.
                 * For example, to change a player's handle, we need to know the GUID.
                 * Or, if the GUID is not specified and there are multiple players with the same handle, we don't want to make unintended changes to one or all such players.
                 * In these cases, we'll notify the user and skip modifying the player.
                 */
                let playerNeedsChanges = true;
                let keysToChange: string[] = [];

                if (!playerChangesToMake) {
                  // We didn't find any requested changes for this player based on GUID or handle.
                  playerNeedsChanges = false;
                } else if (playerChangesToMake) {
                  // If the changesToMake has a handle but no GUID, make sure there is only one such player
                  // Otherwise, we'll abort modifying this player.
                  if (!playerChangesToMake?.guid) {
                    const otherPlayersWithThisHandle = changesToMake?.players?.filter(
                      x => x.handle === thisPlayerRawData?.NickName?.value
                    );
                    if (otherPlayersWithThisHandle?.length > 1) {
                      warnings.push(`Multiple players with the handle ${thisPlayerRawData?.NickName?.value} were found. Because a GUID was not provided, Paver cannot determine which player to modify - to prevent an unintended change, all requested changes for this player will be ignored. Please provide a unique handle or a GUID for each player.`);
                      playerNeedsChanges = false;
                    }
                  }

                  // Make sure we have actual changes to make - if we're just specifying a GUID, we need to have atleast one other change.
                  if (playerNeedsChanges) {

                    // Go ahead and push this user into our list of player savs to modify
                    listOfPlayerSavsToModify.push({
                      guid: normalizedGuid,
                      handle: thisPlayerRawData?.NickName?.value,
                      changesToMake: playerChangesToMake,
                    });

                    Object.keys(playerChangesToMake).forEach(key => {
                      if (
                        key !== 'handle' ||
                        (key === 'handle' &&
                          playerChangesToMake.handle !== thisPlayerRawData?.NickName?.value
                        )) {
                        if (key !== 'guid') {
                          keysToChange.push(key);
                        }
                      }
                    });
                  }
                }

                /**
                * If the player needs changes, let's make those changes and then write to file.
                */
                const targetPlayerPath = `${internalOutputPath}/CharacterSaveParameterMap/Players/${normalizedGuid}.json`;
                ensureFileExists(targetPlayerPath);
                if (playerNeedsChanges && keysToChange.length > 0) {
                  console.info(`Will make ${keysToChange.length} changes (${keysToChange.join(', ').trim()}) to "${thisPlayerRawData?.NickName?.value}" (GUID ${normalizedGuid})"`);
                  const [
                    modifiedPlayerJson,
                    changelogForThisPlayer,
                    changeErrorsForThisPlayer,
                  ] = editPlayerInLevelSav({
                    rawPlayerOrPal,
                    playerChangesToMake,
                  });

                  if (changeErrorsForThisPlayer.length > 0) {
                    warnings = [
                      ...warnings,
                      ...changeErrorsForThisPlayer
                    ]
                  }

                  changelog = [
                    ...changelogForThisPlayer,
                  ]

                  fs.writeFileSync(
                    targetPlayerPath,
                    JSON.stringify(modifiedPlayerJson, null, 2)
                  );
                } else {
                  console.info(`No changes requested for "${thisPlayerRawData?.NickName?.value}" (GUID ${normalizedGuid})"`);
                  // Write back the unmodified player
                  fs.writeFileSync(
                    targetPlayerPath,
                    JSON.stringify(rawPlayerOrPal, null, 2)
                  );
                }
              }
            }
          }
          

          console.info('Properties processed.')
        }
        /**
         * If for some reason we hit this, it means we have a new top-level chunk we aren't expecting to see
         * Maybe this is a co-op file with diff structure, or there's a new update that adds new data?
         */
        else {
          console.warn('Unexpected top-level chunk!');
          warnings.push(`There appears to be top-level data in the Level.sav.json that Paver does not yet know how to handle, or was not expecting. This could be due to a new Palword update or a file with a different structure (such as a co-op game or an unsupported platform). Please report this to the developer.`);
        }

        // For now, we're not going to write anything.
        const dataToWrite = null;
        if (dataToWrite) {
          callback(null, dataToWrite);
        } else {
          callback();
        }

      },
      final(callback) {
        // this.push('}');
        callback();
      }
    });

    // Kick off our streaming pipeline.
    try {
      await pipelineAsync(
        parseTargetData,
        transformStream,
        // targetModifiedJsonStream
      );

      // Now convert the our modified Level.sav JSON data back into a cohesive SAV.
      try {
        console.info('Level.sav.json data has been successfully ingested and modified. Attempting to convert back into a cohesive Level.sav.json file...');
        let isErrorsInConvertion = false;
        
        // If we have a charsave map, we'll need to update the Level.sav.json with the new data.
        if (!isMissingCharSaveMap) {
          const { stdout, stderr } = await execAsync(`python ./helpers/updatePlayersInLevelSav.py "${levelSavJsonPath}" "${internalOutputPath}/CharacterSaveParameterMap" "properties.worldSaveData.value.CharacterSaveParameterMap.value"`);
          console.log(stdout);
          if (stderr) {
            isErrorsInConvertion = true;
            console.error(`Err: ${stderr}`);
          }
        }

        if (!isErrorsInConvertion || criticalErrors.length< 1) {
          console.info('Removing old Level.sav before generating new one...')
          if (fs.existsSync(`${targetGameSaveDirectoryPath}/Level.sav`)) {
            deleteFileSync(`${targetGameSaveDirectoryPath}/Level.sav`);
          }

          // Now let's call CheahJS's tools to convert into Level.sav
          await convertSavAndJson(saveToolsInstallPath, levelSavJsonPath, 'Level.sav');
        }

      } catch (err) {
        console.error(`Caught Err: ${err}`);
      }

      console.log('Successfully ingested and modified Level.sav data, which holds the majority of world & player data. Some fields, like player appearance, tech points and recipes, etc are stored in individual player files. Paver will attempt to modify those next, as needed.');

      // Now let's modify the Players/<GUID>.json files.
      // These are small enough for now, we shouldn't need to stream those. They just contain basic player data.

      for (const playerToModify of listOfPlayerSavsToModify) {
        const targetPlayerPathSav = `${targetGameSaveDirectoryPath}/Players/${normalizeGuid(playerToModify.guid)}.sav`;
        let targetPlayerPath = `${targetGameSaveDirectoryPath}/Players/${normalizeGuid(playerToModify.guid)}.sav`;
        const errorsWithThisPlayer: string[] = [];

        if (appConfig?.skipConversion) {
          targetPlayerPath += '.json';
        }

        if (fs.existsSync(targetPlayerPath)) {

          if (!appConfig?.skipConversion) {
            // Convert the player SAV to JSON

            if (fs.existsSync(`${targetPlayerPath}/Level.sav`)) {
              deleteFileSync(`${targetPlayerPath}/Level.sav`);
            }

            const [
              isPlayerSavConverted,
              playerSavConversionErrors
            ] = await convertSavAndJson(
              saveToolsInstallPath,
              targetPlayerPath,
              `Player Save for ${playerToModify.handle}`
            );

            if (isPlayerSavConverted) {
              console.info(successfulConversion);
              targetPlayerPath += '.json';
            } else {
              errorsWithThisPlayer.push(`Unable to convert ${playerToModify.handle}'s SAV to JSON: ${playerSavConversionErrors.join(', ').trim()}`);
            }
          }

          // If no errors, we should now have a JSON file.
          if (errorsWithThisPlayer.length < 1) {
            const rawPlayerSavData = JSON.parse(fs.readFileSync(targetPlayerPath, 'utf8'));

            const [
              modifiedPlayerJson,
              changelogForThisPlayer,
              changeErrorsForThisPlayer,
            ] = editPlayerSav({
              rawPlayerOrPal: rawPlayerSavData,
              playerChangesToMake: playerToModify.changesToMake,
            });

            if (changeErrorsForThisPlayer.length > 0) {
              warnings = [
                ...warnings,
                ...changeErrorsForThisPlayer
              ]
            }

            changelog = [
              ...changelogForThisPlayer,
            ]

            fs.writeFileSync(
              targetPlayerPath,
              JSON.stringify(modifiedPlayerJson, null, 2)
            );

            if (fs.existsSync(`${targetPlayerPathSav}`)) {
              deleteFileSync(`${targetPlayerPathSav}`);
            }

            // Convert back to SAV
            const [
              isPlayerSavReConverted,
              playerSavReConversionErrors
            ] = await convertSavAndJson(
              saveToolsInstallPath,
              targetPlayerPath,
              `Player Save for ${playerToModify.handle}`
            );

            if (isPlayerSavReConverted) {
              console.info(`Player sav now converted back into SAV.`);
            } else {
              errorsWithThisPlayer.push(`Unable to convert ${playerToModify.handle}'s JSON back to SAV: ${playerSavReConversionErrors.join(', ').trim()}`);
            }
          }

          
        } else {
          if (appConfig?.skipConversion) {
            warnings.push(`Unable to find the a JSON sav file for "${playerToModify.handle}". You opted to skip conversion, so Paver will not attempt to convert their SAV and some changes, like appearance and tech points, will not be made.`);
          } else {
            warnings.push(`Unable to find the player file for "${playerToModify.handle}" at ${targetPlayerPath}.`);
          }
          
        }
      }

    } catch (error) {
      criticalErrors.push('Level.sav.json ingestion pipeline failed: ' + `${error}`);
      console.error('Level.sav.json ingestion pipeline failed:', error);
    }
  } else if (!levelSavJsonPath) {
    criticalErrors.push('Unable to find or convert Level.sav.json. Paver requires a Level.sav.json file to report or affect most changes.');
  }


  // If we have any critical errors, we'll display those to the user and exit.
  if (criticalErrors.length > 0) {
    console.error('Paver has encountered critical errors and cannot continue. Please address the following issues and try again:');
    console.error(criticalErrors);
  }

  if (warnings.length > 0) {
    console.warn('There are a few things that may be of note or useful to you. Please review the following and address as needed:');
    console.warn(warnings);
  }

  console.info('');
  console.info('============================');
  console.info('Paver has finished running.')
  await promptToClose();

};

try {
  saveEditorMain();
} catch (err) {
  console.error('Critical outer-level error:', err);
  process.exit(1);
}
