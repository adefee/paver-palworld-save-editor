const findInNestedObject = require("./findInNestedObject");
const setNestedValue = require("./setNestedValue");
const expPerLevel = require("../data/experiencePerLevel.json");

const getFieldMapByFile = (filename, enableGuardrails) => {
  let returnValue = {};

  const defaultNotSupportedValue = "This field is not (yet) supported - it should be available in the near future!";

  switch (filename) {
    case 'Level.sav':
      returnValue = {
        level: {
          info: "This is a player's level. Specifying `level` without `exp` will automatically calculate and set the player to the matching total XP for the specified level.",
          parameterId: null,
          targetKey: 'Level.value',
          type: 'IntProperty',
          validate: (val) => enableGuardrails ?
            Number.isInteger(val) && val >= 0 && val <= 50 :
            Number.isInteger(val) && val >= 0,
          validationError: 'Level should be an integer between 0 and 50',
        },
        exp: {
          info: "This is a player's total experience points. XP earned from captures, drops, etc scale on this value. For example, setting a level 1 player to level 40 without modifying this value will result in a level 40 player that gains XP at the same rate as a level 1 player (meaning going from 40 -> 41 takes 41 levels' worth of XP, lol). Specifying `level` without `exp` will automatically calculate and set the player to the matching total XP for the specified level.",
          parameterId: null,
          targetKey: 'Exp.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'Exp should be an integer greater than 0',
        },
        handle: {
          info: "Your ingame monicker.",
          parameterId: null,
          targetKey: 'NickName.value',
          type: 'StrProperty',
          validate: (val) => val && enableGuardrails ?
            Number.isInteger(val) && val.length > 0 && val.length <= 20 :
            Number.isInteger(val) && val.length > 0,
          validationError: 'Handle (your name) should be a string with a length of 1-20 characters',
        },
        currentHp: {
          info: "This is the player's current HP. The ingame default is 50000.",
          parameterId: null,
          targetKey: 'HP.value.Value.value',
          type: 'Int64Property',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'currentHp should be an integer greater than 0. The ingame default is 50000.',
        },
        maxHp: {
          info: "This is the player's base maximum HP, before add'l modifiers (like Pals and stat points, etc). The ingame default is 50000.",
          parameterId: null,
          targetKey: 'MaxHP.value.Value.value',
          type: 'Int64Property',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'currentHp should be an integer greater than 0. The ingame default is 50000.',
        },
        maxSp: {
          info: "This is the player's base maximum Stamina, before add'l modifiers (like Pals and stat points, etc). The ingame default is 50000.",
          parameterId: null,
          targetKey: 'MaxSP.value.Value.value',
          type: 'Int64Property',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'currentSp should be an integer greater than 0. The ingame default is 50000.',
        },
        hunger: {
          info: "This is the player's hunger. The ingame default is 100. For some reason, the game calculates this as a 14-point float. Not sure why it needs that much precision.",
          parameterId: null,
          targetKey: 'FullStomach.value',
          type: 'FloatProperty',
          postprocess: (val) => parseFloat(val.toFixed(10)),
          validate: (val) => enableGuardrails ?
            typeof val === 'number' && val >= 0 && val <= 100 :
            typeof val === 'number' && val >= 0,
          validationError: 'hunger should be a decimal (float) between 1 and 100. The ingame default is 100',
        },
        sanityValue: {
          info: "I *think* this is the player's sanity, which doesn't appear to be relevant/used currently? Maybe it is used as a modifier against other values (lower sanity more dmg taken, etc?). Do you know?",
          parameterId: null,
          targetKey: 'SanityValue.value',
          type: 'FloatProperty',
          postprocess: (val) => parseFloat(val.toFixed(10)),
          validate: (val) => enableGuardrails ?
            typeof val === 'number' && val >= 0 && val <= 100 :
            typeof val === 'number' && val >= 0,
          validationError: "sanityValue should be a decimal (float) between 1 and 100. The ingame default is 100. This is listed under the player, not a pal, so it's not clear to me if this is used. Do you know?",
          whatDoesThiDo: true,
        },
        isPlayer: {
          info: "This is a boolean that determines if the player ... is a player. Theoretically. Haven't tried changing this yet. Might enable a spectator mode or something else. The ingame default is true.",
          parameterId: null,
          targetKey: 'IsPlayer.value',
          type: 'BoolProperty',
          validate: (val) => enableGuardrails ?
            typeof val === 'boolean' && val !== false :
            typeof val === 'boolean',
          validationError: 'isPlayer should be a boolean (true/false). The ingame default is true.',
          whatDoesThiDo: true,
        },
        workSpeed: {
          parameterId: null,
          targetKey: 'CraftSpeed.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          info: "This is the base speed at which the player works/crafts. Default is 100. 500 is 5x speed (its kinda hilarious).",
          validationError: 'craftSpeed should be an integer greater than 0. The ingame default is 100.',
        },
        workSpeeds: {
          targetKey: 'CraftSpeeds.value',
          notSupported: "This field is not (yet) supported - it's values are heavily nested with a bunch of child 'WorkSuitability' objects that have unique nuance from other fields.",
          info: "This is the parent property for craft speed settings. This seems to affect base crafting/work speeds for specific types of crafts, items, etc.",
        },
        support: {
          parameterId: null,
          targetKey: 'Support.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'support should be an integer greater than 0. The ingame default is 100.',
          whatDoesThiDo: true,
        },
        unusedStatusPoint: {
          info: "This is the number of unused status points for the player. By default, you receive an new `unusedStatusPoint` every level, which can be spent on status modifiers (hp, weight, stamina, etc). The ingame default is 0.",
          parameterId: null,
          targetKey: 'UnusedStatusPoint.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'unusedStatusPoint should be an integer greater than 0.',
        },
        statusPoints: {
          info: "This is the parent property for status point settings. By default, you receive an new `unusedStatusPoint` every level, which can be spent here. These will be added to your base stats (hp, weight, stamina, etc). The ingame default is 0 for all values.",
          followChildren: true, // tell iterator to follow the children keys instead of just this key
          maxHp: {
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u6700\u5927HP', '最大HP'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            info: "This governs how many status points are spent on max HP. Each point adds +100hp to your max HP base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.maxHp should be an integer greater than 0.',
          },
          maxSp: {
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u6700\u5927SP', '最大SP'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            notSupported: 'temp',
            info: "This governs how many status points are spent on max Stamina. Each point adds +10 to your max Stamina base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.maxSp should be an integer greater than 0.',
          },
          attack: {
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u653b\u6483\u529b', '攻撃力'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            notSupported: 'temp',
            info: "This governs how many status points are spent on attack ('offensive power'). Each point adds +2 to your attack base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.attack should be an integer greater than 0.',
          },
          weight: {
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u6240\u6301\u91cd\u91cf', '所持重量'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            notSupported: 'temp',
            info: "This governs how many status points are spent on carriable weight. Each point adds +50 to your weight base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.weight should be an integer greater than 0.',
          },
          catchRate: {
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u6355\u7372\u7387', '捕獲率'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            notSupported: 'temp',
            info: "This is stored in your SAV file underneath Status Points, but it's actually your capture rate (e.g. from Effigy Captures)! This bumps up your minimum capture rate. Have confirmed a value of 5000 here guarantees a basic blue sphere can 100% first try capture Jetragon, lol. Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.catchRate should be an integer greater than 0.',
          },
          workSpeed: {
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u4f5c\u696d\u901f\u5ea6', '作業速度'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            notSupported: 'temp',
            info: "This governs how many status points are spent on work speed. Each point adds +50 to your work/craft speed base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.catchRate should be an integer greater than 0.',
          },
        },
        voiceId: {
          parameterId: null,
          targetKey: 'VoiceID.value',
          type: 'IntProperty',
          validate: (val) => enableGuardrails ?
            Number.isInteger(val) && val >= 1 && val <= 6 : 
            Number.isInteger(val),
          validationError: 'voiceId should be an integer >= 1 and <= 6. The ingame default is 1. 1-3 are more traditionally feminine voices, 4-6 are more traditionally masculine voices.',
        },
      }
      break;
    case 'Player.sav':
      returnValue = {
        techPoints: {
          info: "Number of unspent technology points for the player.",
          parameterId: null,
          targetKey: 'TechnologyPoint.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'Level should be an integer >= 0',
        },
        ancientTechPoints: {
          info: "Number of unspent ancient technology points (earned from bosses) for the player.",
          parameterId: null,
          targetKey: 'bossTechnologyPoint.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'Level should be an integer >= 0',
        },
        unlockedRecipes: {
          info: "List of unlocked recipes for the player.",
          notSupported: defaultNotSupportedValue,
          parameterId: null,
          validate: (val) => true,
          targetKey: 'UnlockedRecipeTechnologyNames.value',
          type: 'ArrayProperty',
          // validate: (val) => Number.isInteger(val) && val >= 0,
          // validationError: 'Level should be an integer >= 0',
        },
        unlockedFastTravels: {
          info: "Specific fast travels unlocked by the player.",
          notSupported: defaultNotSupportedValue,
          parameterId: null,
          targetKey: 'RecordData.value.FastTravelPointUnlockFlag.value',
          type: 'MapProperty',
          subTypeKey: 'NameProperty',
          subTypeValue: 'BoolProperty',
          // validate: (val) => Number.isInteger(val) && val >= 0,
          // validationError: 'Level should be an integer >= 0',
        },
        relicsInPossession: {
          info: "This is expected to be a count of unspent effigy points for the player.",
          parameterId: null,
          targetKey: 'RecordData.value.RelicPossessNum.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'Level should be an integer >= 0',
          whatDoesThiDo: true,
        },
        countEffigiesFound: {
          info: "Same as `relicsInPossession`. This is expected to be a count of unspent effigy points for the player.",
          parameterId: null,
          targetKey: 'RecordData.value.RelicPossessNum.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'Level should be an integer >= 0',
          whatDoesThiDo: true,
        },
        voiceId: {
          parameterId: null,
          targetKey: 'PlayerCharacterMakeData.value.VoiceID.value',
          type: 'IntProperty',
          validate: (val) => enableGuardrails ?
            Number.isInteger(val) && val >= 1 && val <= 6 : 
            Number.isInteger(val),
          validationError: 'voiceId should be an integer >= 1 and <= 6. The ingame default is 1. 1-3 are more traditionally feminine voices, 4-6 are more traditionally masculine voices.',
        },
        appearance: {
          info: "This is the parent property for a variety of appearance settings. Editing these values will change your appearance in-game. This should be supported soon.",
          followChildren: true, // tell iterator to follow the children keys instead of just this key
          bodyType: {
            info: "Customize the body type for the character (TypeA or TypeB).",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.BodyMeshName.value',
            type: 'StrProperty',
            validate: (val) => enableGuardrails ?
              val?.length > 0 :
              val === 'TypeA' || val === 'TypeB',
            validationError: 'Body type should be either "TypeA" or "TypeB"',
          },
          torsoSize: {
            info: "Size/Volume of the player's torso. Big or smol?",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.TorsoVolume.value',
            type: 'FloatProperty',
            postprocess: (val) => parseFloat(val.toFixed(10)),
            validate: (val) => enableGuardrails ?
              typeof val === 'number' && val >= 0 && val <= 1 :
              typeof val === 'number' && val >= 0,
            validationError: "torsoSize should be a decimal (float) between 1 and 1. The ingame default is 0.5.",
          },
          armSize: {
            info: "Size/Volume of the player's arms. Do you even lift?",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.ArmVolume.value',
            type: 'FloatProperty',
            postprocess: (val) => parseFloat(val.toFixed(10)),
            validate: (val) => enableGuardrails ?
              typeof val === 'number' && val >= 0 && val <= 1 :
              typeof val === 'number' && val >= 0,
            validationError: "armSize should be a decimal (float) between 1 and 1. The ingame default is 0.5.",
          },
          legSize: {
            info: "Size/Volume of the player's legs. Don't skip leg day!",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.ArmVolume.value',
            type: 'FloatProperty',
            postprocess: (val) => parseFloat(val.toFixed(10)),
            validate: (val) => enableGuardrails ?
              typeof val === 'number' && val >= 0 && val <= 1 :
              typeof val === 'number' && val >= 0,
            validationError: "armSize should be a decimal (float) between 1 and 1. The ingame default is 0.5.",
          },
          headType: {
            info: "Customize the head type for the character (type1, type2, etc).",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.HeadMeshName.value',
            type: 'StrProperty',
            // TODO: Better validation here.
            validate: (val) => enableGuardrails ?
              val.length > 0 && /\btype\s*(?:[1-9]|1[0-9]|2[01])\b/.test(val) :
              val.length > 0,
            validationError: 'Head type should look like "type1", "type2", etc',
            notSupported: defaultNotSupportedValue,
          },
          hairType: {
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.HairMeshName.value',
            type: 'StrProperty',
            // TODO: Better validation here.
            validate: (val) => enableGuardrails ?
              val.length > 0 && /\btype\s*(?:[1-9]|1[0-9]|2[01])\b/.test(val) :
              val.length > 0 ,
            validationError: 'Hair type should look like "type1", "type2", etc',
            notSupported: defaultNotSupportedValue,
          },
          hairColor: {
            info: "Customize the rgba values for the character's hair color",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.HairColor.value',
            type: 'StructProperty',
            // TODO: Better validation here.
            // validate: (val) => val.length > 0 && (enableGuardrails && !val.includes('type')),
            // validationError: '',
            notSupported: defaultNotSupportedValue,
          },
          browColor: {
            info: "Customize the rgba values for the character's brow color",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.BrowColor.value',
            type: 'StructProperty',
            // TODO: Better validation here.
            // validate: (val) => val.length > 0 && (enableGuardrails && !val.includes('type')),
            // validationError: '',
            notSupported: defaultNotSupportedValue,
          },
          bodyColor: {
            info: "Customize the rgba values for the character's body color",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.BodyColor.value',
            type: 'StructProperty',
            // TODO: Better validation here.
            // validate: (val) => val.length > 0 && (enableGuardrails && !val.includes('type')),
            // validationError: '',
            notSupported: defaultNotSupportedValue,
          },
          bodySubsurfaceColor: {
            info: "Customize the rgba values for the character's body subsurface color",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.BodySubsurfaceColor.value',
            type: 'StructProperty',
            // TODO: Better validation here.
            // validate: (val) => val.length > 0 && (enableGuardrails && !val.includes('type')),
            // validationError: '',
            notSupported: defaultNotSupportedValue,
          },
          eyeColor: {
            info: "Customize the rgba values for the character's eye color",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.EyeColor.value',
            type: 'StructProperty',
            // TODO: Better validation here.
            // validate: (val) => val.length > 0 && (enableGuardrails && !val.includes('type')),
            // validationError: '',
            notSupported: defaultNotSupportedValue,
          },
          eyeMaterialName: {
            info: "Customize the eye material/preset for the character's eye",
            parameterId: null,
            targetKey: 'PlayerCharacterMakeData.value.EyeMaterialName.value',
            type: 'NameProperty',
            validate: (val) => enableGuardrails ?
              val.length > 0 && /\bType0*(?:[1-9]|1[0-9]|2[01])\b/.test(val) :
              val.length > 0 ,
            // notSupported: defaultNotSupportedValue,
          },
        },
      }
      break;
    default:
      console.error('getFieldMapByFile(): Invalid target file name:', filename);
      break;
  }

  return returnValue;
}

/**
 * Make modifications to a target player's CharacterSaveParameterMap in Level.sav.json
 * @param {object} targetPlayerLevelSavJson 
 * @param {object} changesToMake 
 * @returns 
 */
const updatePlayerLevelSavData = (targetPlayerLevelSavJson, changesToMake, playerId) => {
  const changelog = [];
  const errors = [];
  // This will be worldPlayerData?.[foundPlayer.levelSavPlayerIndex]?.value?.RawData?.value?.object?.SaveParameter?.value;
  let newPlayerLevelSavJson = targetPlayerLevelSavJson;

  const fieldMap = getFieldMapByFile('Level.sav');

  try {

    const recursivelyMakeChanges = (keyName, changeValue, singleFieldMapEntry) => {
      // console.info("Keyname, ChangeValue, SingleMapEntry", keyName, changeValue, singleFieldMapEntry)

      if (keyName === 'handle' && changeValue === playerId) {
        // Don't allow the player to change their own handle if no GUID is specified
        console.info("This player's handle won't be checked or modified because we couldn't determine a GUID.")
        return;
      }

      if (singleFieldMapEntry) {
        const thisChangeLog = {
          entity: 'player',
          entityId: playerId,
          file: 'Level.sav',
          field: keyName,
          keyInFile: singleFieldMapEntry.targetKey,
          newValue: changeValue,
        }

        // If the field is marked as not supported, log such and skip attempted changes.
        if (singleFieldMapEntry?.notSupported) {
          thisChangeLog.notSupported = singleFieldMapEntry?.notSupported;
          changelog.push(thisChangeLog);
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

        if (singleFieldMapEntry?.validate && singleFieldMapEntry?.validate(changeValue)) {
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
              newPlayerLevelSavJson,
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
          } = setNestedValue(newPlayerLevelSavJson, {
            ...singleFieldMapEntry,
            targetKey: nestedFieldMapKey, // Temporary overwrite of targetKey in case of super-deeply nested values.
          }, newValue);

          thisChangeLog.oldValue = oldValue;
          newPlayerLevelSavJson = modifiedObject;

          
          if (keyName === 'level') {
            // If we're updating the players level, and Exp is not also defined, calculate and set the player's total XP. If Exp is also defined, we'll assume the user knows what they're doing and won't override it.
            if (!('exp' in changesToMake)) {
              // Get our calculated amount of XP based on level.
              const newExpAmount = expPerLevel[newValue]?.TotalEXP + 1; // Add 1 to ensure we're at least 1 XP over the previous level.
              const expFieldMapEntry = fieldMap['exp'];
              if (expFieldMapEntry) {
                const expChangeLog = {
                  entity: 'player',
                  entityId: playerId,
                  file: 'Level.sav',
                  field: 'exp',
                  keyInFile: expFieldMapEntry.targetKey,
                  newValue: newExpAmount,
                }

                const {
                  modifiedObject: expModifiedObject,
                  oldValue: oldExpValue
                } = setNestedValue(newPlayerLevelSavJson, {
                  ...expFieldMapEntry,
                }, newExpAmount);

                if (modifiedObject) {
                  expChangeLog.oldValue = oldExpValue;
                  expChangeLog.validationPassed = true;
                }

                changelog.push(expChangeLog);
                newPlayerLevelSavJson = expModifiedObject;

              } else {
                console.error('Unable to find the Exp.value field in the field map. This is a bug. Please report it.');
                errors.push('Unable to find the Exp.value field in the field map. This is a bug. Please report it.');
              }
            } else {
              console.info("Note: You are updating a player's level, and you've defined an `exp` value. The `exp` value will be used to set the player's total XP. Be careful with this, as it can result in a player with a level that doesn't match their XP (a level 40 could end up getting XP as if they're level 1). If you want to set the player's level and XP to match, you should only define the `level` value and this tool will calculate for you.");
            }
            // Add a new changlog for this.
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

        changelog.push(thisChangeLog);
      } else {
        if (process.env.DEBUG) {
          console.log('updatePlayerLevelSavData(): Invalid field name:', key);
        }
      }
    }

    // Start initial round of iteration over changes.
    Object.keys(changesToMake).forEach((key) => {
      
      let thisFieldMapEntry = fieldMap[key];
      let changeValue = changesToMake[key];

      recursivelyMakeChanges(key, changeValue, thisFieldMapEntry);
    });
  } catch (err) {
    console.error('Error updating player data in Level.sav.json:', err);
    errors.push(err);
  }

  return [newPlayerLevelSavJson, changelog, errors];
}

/**
 * Make modifications to a target player's SaveData in Players/<playerGuid>.sav.json
 * @param {object} targetPlayerPersonalSavJson 
 * @param {object} changesToMake 
 * @returns 
 */
const updatePlayerPersonalSaveData = (targetPlayerPersonalSavJson, changesToMake, playerId) => {
  const changelog = [];
  const errors = [];
  let newPlayerLevelSavJson = targetPlayerPersonalSavJson;

  const fieldMap = getFieldMapByFile('Player.sav');

  try {

    const recursivelyMakeChanges = (keyName, changeValue, singleFieldMapEntry) => {
      // console.info("Keyname, ChangeValue, SingleMapEntry", keyName, changeValue, singleFieldMapEntry)

      if (singleFieldMapEntry) {
        const thisChangeLog = {
          entity: 'player',
          entityId: playerId,
          file: `Player/<guid>.sav`,
          field: keyName,
          keyInFile: singleFieldMapEntry.targetKey,
          newValue: changeValue,
        }

        // If the field is marked as not supported, log such and skip attempted changes.
        if (singleFieldMapEntry?.notSupported) {
          thisChangeLog.notSupported = singleFieldMapEntry?.notSupported;
          changelog.push(thisChangeLog);
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

        if ('validate' in singleFieldMapEntry && singleFieldMapEntry?.validate(changeValue)) {
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
              newPlayerLevelSavJson,
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
          } = setNestedValue(newPlayerLevelSavJson, {
            ...singleFieldMapEntry,
            targetKey: nestedFieldMapKey, // Temporary overwrite of targetKey in case of super-deeply nested values.
          }, newValue);

          thisChangeLog.oldValue = oldValue;
          newPlayerLevelSavJson = modifiedObject;
        } else {
          thisChangeLog.validationPassed = false;
          thisChangeLog.validationError = singleFieldMapEntry?.validationError ||
            `Field validation failed - value should be an ${singleFieldMapEntry?.type}`;
        }

        // Rerun post process for changeloog value.
        if ('postprocess' in singleFieldMapEntry) {
          thisChangeLog.newValue = singleFieldMapEntry?.postprocess(thisChangeLog.newValue);
        }

        changelog.push(thisChangeLog);
      } else {
        if (process.env.DEBUG) {
          console.log('updatePlayerLevelSavData(): Invalid field name:', key);
        }
      }
    }

    // Start initial round of iteration over changes.
    Object.keys(changesToMake).forEach((key) => {
      
      let thisFieldMapEntry = fieldMap[key];
      let changeValue = changesToMake[key];

      recursivelyMakeChanges(key, changeValue, thisFieldMapEntry);
    });
  } catch (err) {
    console.error('Error updating player data in Level.sav.json:', err);
    errors.push(err);
  }

  return [newPlayerLevelSavJson, changelog, errors];
}

module.exports = {
  updatePlayerLevelSavData,
  updatePlayerPersonalSaveData,
  getFieldMapByFile
}
