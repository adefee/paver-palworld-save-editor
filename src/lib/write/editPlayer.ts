import { IChangelogEntry, IPaverConfigPlayerChanges } from "../../types/Paver";
import { IPlayerSaveAsJson, ISaveAsJsonPalPlayerKeyValuePair } from "../../types/SaveAsJson";
import findInNestedObject from "../findInNestedObject";
import normalizeGuid from "../normalizeGuid";
import { getPlayerFieldMapByFile } from "../getFieldMap";
import setNestedValue from "../setNestedValue";
const experienceData = require(`../../data/experiencePerLevel.json`);

/**
 * 
 * @param playerJson 
 * @param playerChangesToMake 
 * @returns 
 */
export const editPlayerInLevelSav = ({
  rawPlayerOrPal,
  playerChangesToMake,
}: {
  rawPlayerOrPal: ISaveAsJsonPalPlayerKeyValuePair,
  playerChangesToMake: IPaverConfigPlayerChanges
}): [ISaveAsJsonPalPlayerKeyValuePair, IChangelogEntry[], string[]] => {
  const modifiedPlayerOrPal = rawPlayerOrPal;
  const playerChangelog: IChangelogEntry[] = [];
  const fieldMap = getPlayerFieldMapByFile('Level.sav');
  const normalizedGuid = normalizeGuid(rawPlayerOrPal.key.PlayerUId.value)
  const playerChangeErrors: string[] = [];
  const successfulChangedKeys: string[] = [];

  if (!modifiedPlayerOrPal?.value?.RawData?.value?.object?.SaveParameter) {
    playerChangeErrors.push(`Unable to find SaveParameter in ${normalizedGuid} player object. This may hint at a corrupted player or save file, or a player that does not actually exist.`);
    return [
      modifiedPlayerOrPal,
      playerChangelog,
      playerChangeErrors,
    ];
  }

  let {
    value: modifiedPlayerJson
  } = modifiedPlayerOrPal?.value?.RawData?.value?.object?.SaveParameter;

  // Iterate over changes and 
  const recursivelyMakeChanges = (keyName: string, changeValue: any, singleFieldMapEntry) => {
    if (singleFieldMapEntry) {
      const thisChangeLog: IChangelogEntry = {
        entity: 'player',
        entityId: normalizedGuid,
        file: 'Level.sav',
        field: keyName,
        keyInFile: singleFieldMapEntry.targetKey,
        newValue: changeValue,
      }

      // If the field is marked as not supported, log such and skip attempted changes.
      if (singleFieldMapEntry?.notSupported) {
        thisChangeLog.notSupported = singleFieldMapEntry?.notSupported;
        playerChangelog.push(thisChangeLog);
        return;
      }

      // If the field map key has a followChildren flag, iterate over the children keys instead of this key.
      // Some items have followChildren just to help preserve a structure closer to the original file and for add'l notes/context.
      if (singleFieldMapEntry?.followChildren) {
        Object.keys(changeValue).forEach((subKey) => {
          const thisSubFieldMapEntry = singleFieldMapEntry[subKey];
          const thisSubChangeValue = changeValue[subKey];

          if (thisSubFieldMapEntry) {
            recursivelyMakeChanges(subKey, thisSubChangeValue, thisSubFieldMapEntry);
          } else {
            if (process.env.DEBUG) {
              console.log('updatePlayerLevelSavData(): Invalid field name:', subKey);
            }
          }
        });

        return;
      }

      if (singleFieldMapEntry?.whatDoesThiDo) {
        thisChangeLog.unknownField = "Do you know what this field does? I don't, but you can change it anyways :P Let me know if you figure it out!";
      }

      if (!singleFieldMapEntry.validate || ('validate' in singleFieldMapEntry && singleFieldMapEntry?.validate(changeValue))) {
        thisChangeLog.validationPassed = true;
        let newValue = changeValue;

        // This is the key we'll use to set the nested value later
        // This may end up changing if we have to reference an (even deeper) nested value, e.g for status points.
        let nestedFieldMapKey = singleFieldMapEntry.targetKey;

        // If we have a postprocess function, run it here.
        if ('postprocess' in singleFieldMapEntry) {
          newValue = singleFieldMapEntry.postprocess(newValue);
        }

        // Some nested values, like status points, require a bit of extra work to find.
        // If we need to use a filter to find the right value, do that here.
        if ('findWithFilter' in singleFieldMapEntry) {
          // Find the nested value with the given filter
          const [nestedFilteredReferenceIndex] = findInNestedObject(
            modifiedPlayerJson,
            singleFieldMapEntry.targetKey,
            singleFieldMapEntry.findWithFilter
          );

          // Check the result
          if (nestedFilteredReferenceIndex !== -1) {
            // We found the reference!
            // We may also have a `targetFilteredKey` to specify a nested key to update.
            nestedFieldMapKey =
              `${singleFieldMapEntry.targetKey}.${nestedFilteredReferenceIndex}.${singleFieldMapEntry.targetFilteredKey || 'value'}`

          } else {
            console.log('No matching value found.');
          }
        }

        const {
          modifiedObject,
          oldValue
        } = setNestedValue(modifiedPlayerJson, {
          ...singleFieldMapEntry,
          targetKey: nestedFieldMapKey, // Temporary overwrite of targetKey in case of super-deeply nested values.
        }, newValue);

        thisChangeLog.oldValue = oldValue;
        modifiedPlayerJson = modifiedObject;
        successfulChangedKeys.push(keyName);

        // Handle special cases for some values
        if (keyName === 'level') {
          // If we're updating the players level, and Exp is not also defined, calculate and set the player's total XP. If Exp is also defined, we'll assume the user knows what they're doing and won't override it.
          if (!('exp' in playerChangesToMake)) {
            // Get our calculated amount of XP based on level.
            const newExpAmount = experienceData[newValue]?.TotalEXP + 1; // Add 1 to ensure we're at least 1 XP over the previous level.
            const expFieldMapEntry = fieldMap['exp'];
            if (expFieldMapEntry) {
              const expChangeLog: IChangelogEntry = {
                entity: 'player',
                entityId: normalizedGuid,
                file: 'Level.sav',
                field: 'exp',
                keyInFile: expFieldMapEntry.targetKey,
                newValue: newExpAmount,
              }

              const {
                modifiedObject: expModifiedObject,
                oldValue: oldExpValue
              } = setNestedValue(modifiedPlayerJson, {
                ...expFieldMapEntry,
              }, newExpAmount);

              if (modifiedObject) {
                expChangeLog.oldValue = oldExpValue;
                expChangeLog.validationPassed = true;
              }

              playerChangelog.push(expChangeLog);
              modifiedPlayerJson = expModifiedObject;

            } else {
              console.error('Unable to find the Exp.value field in the field map. This is a bug. Please report it.');
              playerChangeErrors.push('Unable to find the Exp.value field in the field map. This is a bug. Please report it.');
            }
          } else {
            console.info("Note: You are updating a player's level, and you've defined an `exp` value. The `exp` value will be used to set the player's total XP. Be careful with this, as it can result in a player with a level that doesn't match their XP (a level 40 could end up getting XP as if they're level 1). If you want to set the player's level and XP to match, you should only define the `level` value and this tool will calculate for you.");
          }
          // Add a new changlog for this.
        }

        /**
         * TODO: Add support for cascading changes, where a given change will trigger additional changes to other fields.
         * This would be defined in field map and would be useful for things like status points, where changing the status points would also change the maxHp, maxSp, etc.
         */

        // User wants to adjust status point on maxHp
        if (singleFieldMapEntry?.paverId === 'statusPoints.maxHp') {
          let tempNewAmount = 500000 + (newValue * 100000); // Work speed should be the base amt + (status points * 100)
          const tempRefFieldMapEntry = fieldMap['maxHp'];
          if (tempRefFieldMapEntry) {
            const tempNewChangeLog: IChangelogEntry = {
              entity: 'player',
              entityId: normalizedGuid,
              file: 'Level.sav',
              field: keyName,
              keyInFile: tempRefFieldMapEntry.targetKey,
              newValue: tempNewAmount,
              notes: `${keyName} should be the base amount (100) plus (status points * 100). This field was modified because this player's "${singleFieldMapEntry?.paverId}" was updated.`,
            }

            const {
              modifiedObject: tempNewModifiedObject,
              oldValue: oldReferenceValue
            } = setNestedValue(modifiedPlayerJson, {
              ...tempRefFieldMapEntry,
            }, tempNewAmount);

            if (modifiedObject) {
              tempNewChangeLog.oldValue = oldReferenceValue;
              tempNewChangeLog.validationPassed = true;
            }

            playerChangelog.push(tempNewChangeLog);
            modifiedPlayerJson = tempNewModifiedObject;

          } else {
            console.error(`Unable to find the ${keyName} field in the field map. This is a bug. Please report it.`);
            playerChangeErrors.push(`Unable to find the ${keyName} field in the field map. This is a bug. Please report it.`);
          }
        }

        // User wants to adjust status point on maxSp
        if (singleFieldMapEntry?.paverId === 'statusPoints.maxSp') {
          let tempNewAmount = 100 + (newValue * 10); // Work speed should be the base amt + (status points * 10)
          const tempRefFieldMapEntry = fieldMap['maxSp'];
          if (tempRefFieldMapEntry) {
            const tempNewChangeLog: IChangelogEntry = {
              entity: 'player',
              entityId: normalizedGuid,
              file: 'Level.sav',
              field: keyName,
              keyInFile: tempRefFieldMapEntry.targetKey,
              newValue: tempNewAmount,
              notes: `${keyName} should be the base amount (100) plus (status points * 10). This field was modified because this player's "${singleFieldMapEntry?.paverId}" was updated.`,
            }

            const {
              modifiedObject: tempNewModifiedObject,
              oldValue: oldReferenceValue
            } = setNestedValue(modifiedPlayerJson, {
              ...tempRefFieldMapEntry,
            }, tempNewAmount);

            if (modifiedObject) {
              tempNewChangeLog.oldValue = oldReferenceValue;
              tempNewChangeLog.validationPassed = true;
            }

            playerChangelog.push(tempNewChangeLog);
            modifiedPlayerJson = tempNewModifiedObject;

          } else {
            console.error(`Unable to find the ${keyName} field in the field map. This is a bug. Please report it.`);
            playerChangeErrors.push(`Unable to find the ${keyName} field in the field map. This is a bug. Please report it.`);
          }
        }

        /**
         * Attack/Weight do not need to be updated outside of the statusPoints array
         */

        // User wants to adjust status point on work speed
        if (singleFieldMapEntry?.paverId === 'statusPoints.workSpeed') {
          const newWorkSpeedAmt = 100 + (newValue * 50); // Work speed should be the base amt + (status points * 50)
          const workSpeedFieldMapEntry = fieldMap['workSpeed'];
          if (workSpeedFieldMapEntry) {
            const workSpeedChangeLog: IChangelogEntry = {
              entity: 'player',
              entityId: normalizedGuid,
              file: 'Level.sav',
              field: keyName,
              keyInFile: workSpeedFieldMapEntry.targetKey,
              newValue: newWorkSpeedAmt,
              notes: `Work speed should be the base amount (100) plus (status points * 50). This field was modified because this player's "${singleFieldMapEntry?.paverId}" was updated.`,
            }

            const {
              modifiedObject: workSpeedModifiedObject,
              oldValue: oldWorkSpeedValue
            } = setNestedValue(modifiedPlayerJson, {
              ...workSpeedFieldMapEntry,
            }, newWorkSpeedAmt);

            if (modifiedObject) {
              workSpeedChangeLog.oldValue = oldWorkSpeedValue;
              workSpeedChangeLog.validationPassed = true;
            }

            playerChangelog.push(workSpeedChangeLog);
            modifiedPlayerJson = workSpeedModifiedObject;

          } else {
            console.error('Unable to find the workSpeed field in the field map. This is a bug. Please report it.');
            playerChangeErrors.push('Unable to find the workSpeed field in the field map. This is a bug. Please report it.');
          }
        }
      } else {
        thisChangeLog.validationPassed = false;
        thisChangeLog.validationError = singleFieldMapEntry?.validationError ||
          `Field validation failed - value should be an ${singleFieldMapEntry?.type}`;
      }

      // Rerun post process for changeloog value.
      if ('postprocess' in singleFieldMapEntry) {
        thisChangeLog.newValue = singleFieldMapEntry?.postprocess(thisChangeLog.newValue);
      }

      playerChangelog.push(thisChangeLog);
    } else {
      if (process.env.DEBUG) {
        console.log('updatePlayerLevelSavData(): Invalid field name:', keyName);
      }
    }
  }

  // Start initial round of iteration over changes.
  Object.keys(playerChangesToMake).forEach((key) => {
    let thisFieldMapEntry = fieldMap[key];
    let changeValue = playerChangesToMake[key];
    recursivelyMakeChanges(key, changeValue, thisFieldMapEntry);
  });

  console.info(`Successfully modified ${successfulChangedKeys.length} changes in Level.sav (${successfulChangedKeys.join(', ').trim()}) for this player.`)
  
  return [
    modifiedPlayerOrPal,
    playerChangelog,
    playerChangeErrors,
  ];
};

/**
 * Edit a players /Players/<guid>.sav.json file
 * This is structured a bit differently than the Level.sav.json file.
 */
export const editPlayerSav = ({
  rawPlayerOrPal,
  playerChangesToMake,
}: {
  rawPlayerOrPal: IPlayerSaveAsJson,
  playerChangesToMake: IPaverConfigPlayerChanges
  }): [IPlayerSaveAsJson, IChangelogEntry[], string[]] => {
  const modifiedPlayerOrPal = rawPlayerOrPal;
  const playerChangelog: IChangelogEntry[] = [];
  const fieldMap = getPlayerFieldMapByFile('Player.sav');
  const normalizedGuid = normalizeGuid(modifiedPlayerOrPal.properties?.SaveData?.value?.PlayerUId?.value)
  const playerChangeErrors: string[] = [];
  const successfulChangedKeys: string[] = [];

  if (!modifiedPlayerOrPal?.properties?.SaveData?.value) {
    playerChangeErrors.push(`Unable to find SaveParameter in ${normalizedGuid} player object. This may hint at a corrupted player or save file, or a player that does not actually exist.`);
    return [
      modifiedPlayerOrPal,
      playerChangelog,
      playerChangeErrors,
    ];
  }

  let {
    value: modifiedPlayerJson
  } = modifiedPlayerOrPal?.properties?.SaveData;

  // Iterate over changes and 
  const recursivelyMakeChanges = (keyName: string, changeValue: any, singleFieldMapEntry) => {
    // console.info("Keyname, ChangeValue, SingleMapEntry", keyName, changeValue, singleFieldMapEntry)

    if (singleFieldMapEntry) {
      const thisChangeLog: IChangelogEntry = {
        entity: 'player',
        entityId: normalizedGuid,
        file: 'Player.sav',
        field: keyName,
        keyInFile: singleFieldMapEntry.targetKey,
        newValue: changeValue,
      }

      // If the field is marked as not supported, log such and skip attempted changes.
      if (singleFieldMapEntry?.notSupported) {
        thisChangeLog.notSupported = singleFieldMapEntry?.notSupported;
        playerChangelog.push(thisChangeLog);
        return;
      }

      // If the field map key has a followChildren flag, iterate over the children keys instead of this key.
      // Some items have followChildren just to help preserve a structure closer to the original file and for add'l notes/context.
      if (singleFieldMapEntry?.followChildren) {
        Object.keys(changeValue).forEach((subKey) => {
          const thisSubFieldMapEntry = singleFieldMapEntry[subKey];
          const thisSubChangeValue = changeValue[subKey];

          if (thisSubFieldMapEntry) {
            recursivelyMakeChanges(subKey, thisSubChangeValue, thisSubFieldMapEntry);
          } else {
            if (process.env.DEBUG) {
              console.log('updatePlayerLevelSavData(): Invalid field name:', subKey);
            }
          }
        });

        return;
      }

      if (singleFieldMapEntry?.whatDoesThiDo) {
        thisChangeLog.unknownField = "Do you know what this field does? I don't, but you can change it anyways :P Let me know if you figure it out!";
      }

      if (!singleFieldMapEntry.validate || ('validate' in singleFieldMapEntry && singleFieldMapEntry?.validate(changeValue))) {
        thisChangeLog.validationPassed = true;
        let newValue = changeValue;

        // This is the key we'll use to set the nested value later
        // This may end up changing if we have to reference an (even deeper) nested value, e.g for status points.
        let nestedFieldMapKey = singleFieldMapEntry.targetKey;

        // If we have a postprocess function, run it here.
        if ('postprocess' in singleFieldMapEntry) {
          newValue = singleFieldMapEntry.postprocess(newValue);
        }

        // Some nested values, like status points, require a bit of extra work to find.
        // If we need to use a filter to find the right value, do that here.
        if ('findWithFilter' in singleFieldMapEntry) {
          // Find the nested value with the given filter
          const [nestedFilteredReferenceIndex] = findInNestedObject(
            modifiedPlayerJson,
            singleFieldMapEntry.targetKey,
            singleFieldMapEntry.findWithFilter
          );

          // Check the result
          if (nestedFilteredReferenceIndex !== -1) {
            // We found the reference!
            // We may also have a `targetFilteredKey` to specify a nested key to update.
            nestedFieldMapKey =
              `${singleFieldMapEntry.targetKey}.${nestedFilteredReferenceIndex}.${singleFieldMapEntry.targetFilteredKey || 'value'}`

          } else {
            console.log('No matching value found.');
          }
        }

        const {
          modifiedObject,
          oldValue
        } = setNestedValue(modifiedPlayerJson, {
          ...singleFieldMapEntry,
          targetKey: nestedFieldMapKey, // Temporary overwrite of targetKey in case of super-deeply nested values.
        }, newValue);

        thisChangeLog.oldValue = oldValue;
        modifiedPlayerJson = modifiedObject;
        successfulChangedKeys.push(keyName);

      } else {
        thisChangeLog.validationPassed = false;
        thisChangeLog.validationError = singleFieldMapEntry?.validationError ||
          `Field validation failed - value should be an ${singleFieldMapEntry?.type}`;
      }

      // Rerun post process for changeloog value.
      if ('postprocess' in singleFieldMapEntry) {
        thisChangeLog.newValue = singleFieldMapEntry?.postprocess(thisChangeLog.newValue);
      }

      playerChangelog.push(thisChangeLog);
    } else {
      if (process.env.DEBUG) {
        console.log('updatePlayerLevelSavData(): Invalid field name:', keyName);
      }
    }
  }

  // Start initial round of iteration over changes.
  Object.keys(playerChangesToMake).forEach((key) => {
    let thisFieldMapEntry = fieldMap[key];
    let changeValue = playerChangesToMake[key];
    recursivelyMakeChanges(key, changeValue, thisFieldMapEntry);
  });

  console.info(`Successfully modified ${successfulChangedKeys.length} changes in Players/<guid>.sav (${successfulChangedKeys.join(', ').trim()}) for this player.`)

  return [
    modifiedPlayerOrPal,
    playerChangelog,
    playerChangeErrors,
  ];
};

export default {
  editPlayerInLevelSav,
  editPlayerSav,
};
