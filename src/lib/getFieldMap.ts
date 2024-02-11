export interface IFieldMapEntry {
  info?: string,
  parameterId: string | null, // This will be the parameterId of the field, if it has one (amost never).
  targetKey: string,
  targetFilteredKey?: string,
  type: string,
  validate?: (val: any) => boolean,
  validationError?: string,
  postprocess?: (val: any) => any,
  notSupported?: string,
  followChildren?: boolean,
  whatDoesThiDo?: boolean,
  subTypeKey?: string,
  subTypeValue?: string,
  findWithFilter?: (val: any) => boolean,
  struct_id?: string, // Some fields may optionally contain a struct_id, which we use if we need to rebuild the entire object (e.g. maxSp may not exist)
  struct_type?: string, // Some fields may optionally contain a struct_type, which we use if we need to rebuild the entire object (e.g. maxSp may not exist)
  paverId?: string, // Some fields may optionally contain a paverId, which is just an internal identifer for when Paver applies custom logic.
  structure?: any
}

/**
 * 
 * @param filename Filename (Level.sav or Player.sav). This just lets us more easily discriminate which values are available for which file.
 * @param enableGuardrails Deeper validation to help ensure values are within the "intended" confines of the game.
 * @returns 
 */
export const getPlayerFieldMapByFile = (filename: string, enableGuardrails = true): {
  [key: string]: IFieldMapEntry
} => {
  let returnValue = {};
  const defaultNotSupportedValue = "This field is not (yet) supported - it should be available in the near future!";

  /**
   * Build an initial map of values, and then our switch statement can reference the same value with aliases as needed
   */
  const fieldMapAliasedValues: {
    [key: string]: IFieldMapEntry
  } = {
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
      validate: (val: string) => enableGuardrails ?
        val?.length >= 0 && val?.length <= 50 :
        val?.length >= 0,
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
      structure: [
        // Level 1 structure for 'HP'
        { "struct_type": "FixedPoint64", "struct_id": "00000000-0000-0000-0000-000000000000", "id": null, "type": "StructProperty" },
        // Level 2 structure for 'value'
        {},
        // Level 3 structure for 'Value'
        { "id": null, "type": "StructProperty" }
      ]
    },
    maxSp: {
      info: "This is the player's base maximum Stamina, before add'l modifiers (like Pals and stat points, etc). The ingame default is 50000.",
      parameterId: null,
      targetKey: 'MaxSP.value.Value.value',
      type: 'Int64Property',
      validate: (val) => Number.isInteger(val) && val >= 0,
      validationError: 'currentSp should be an integer greater than 0. The ingame default is 50000.',
      structure: [
        // Level 1 structure for 'HP'
        { "struct_type": "FixedPoint64", "struct_id": "00000000-0000-0000-0000-000000000000", "id": null, "type": "StructProperty" },
        // Level 2 structure for 'value'
        {},
        // Level 3 structure for 'Value'
        { "id": null, "type": "StructProperty" }
      ]
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
    workSpeed: {
      parameterId: null,
      targetKey: 'CraftSpeed.value',
      type: 'IntProperty',
      validate: (val) => Number.isInteger(val) && val >= 0,
      info: "This is the base speed at which the player works/crafts. Default is 100. 500 is 5x speed (its kinda hilarious).",
      validationError: 'craftSpeed should be an integer greater than 0. The ingame default is 100.',
    },
    unusedStatusPoint: {
      info: "This is the number of unused status points for the player. By default, you receive an new `unusedStatusPoint` every level, which can be spent on status modifiers (hp, weight, stamina, etc). The ingame default is 0.",
      parameterId: null,
      targetKey: 'UnusedStatusPoint.value',
      type: 'IntProperty',
      validate: (val) => Number.isInteger(val) && val >= 0,
      validationError: 'unusedStatusPoint should be an integer greater than 0.',
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
    countEffigiesFound: {
      info: "Same as `relicsInPossession`. This is expected to be a count of unspent effigy points for the player.",
      parameterId: null,
      targetKey: 'RecordData.value.RelicPossessNum.value',
      type: 'IntProperty',
      validate: (val) => Number.isInteger(val) && val >= 0,
      validationError: 'Effigy count should be an integer >= 0',
      whatDoesThiDo: true,
    },
    captureRate: {
      paverId: 'statusPoints.captureRate',
      parameterId: null,
      targetKey: 'GotStatusPointList.value.values',
      targetFilteredKey: 'StatusPoint.value',
      findWithFilter: (spObj) => ['\u6355\u7372\u7387', '捕獲率'].includes(spObj.StatusName.value),
      type: 'IntProperty',
      info: "This is stored in your SAV file underneath Status Points, but it's actually your capture rate (e.g. from Effigy Captures)! This bumps up your minimum capture rate. Have confirmed a value of 5000 here guarantees a basic blue sphere can 100% first try capture Jetragon, lol. Default is 0.",
      validate: (val) => Number.isInteger(val) && val >= 0,
      validationError: 'statusPoints.captureRate should be an integer greater than 0.',
    },
  }

  switch (filename) {
    case 'Level.sav':
      returnValue = {
        level: fieldMapAliasedValues.level,
        exp: fieldMapAliasedValues.exp,
        experience: fieldMapAliasedValues.exp,
        xp: fieldMapAliasedValues.exp,
        handle: fieldMapAliasedValues.handle,
        name: fieldMapAliasedValues.handle,
        currentHp: fieldMapAliasedValues.currentHp,
        currentHP: fieldMapAliasedValues.currentHp,
        maxHp: fieldMapAliasedValues.maxHp,
        maxHP: fieldMapAliasedValues.maxHp,
        maxHealth: fieldMapAliasedValues.maxHp,
        maxSp: fieldMapAliasedValues.maxSp,
        maxSP: fieldMapAliasedValues.maxSp,
        maxStamina: fieldMapAliasedValues.maxSp,
        hunger: fieldMapAliasedValues.hunger,
        fullStomach: fieldMapAliasedValues.hunger,
        sanityValue: fieldMapAliasedValues.sanityValue,
        sanity: fieldMapAliasedValues.sanityValue,
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
        craftSpeed: fieldMapAliasedValues.workSpeed,
        workSpeed: fieldMapAliasedValues.workSpeed,
        workSpeeds: {
          targetKey: 'CraftSpeeds.value',
          info: "This is the parent property for craft speed settings. This seems to affect base crafting/work speeds for specific types of crafts, items, etc.",
          kindling: {
            paverId: 'work.kindling',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::EmitFlame'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the EmitFlame WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.kindling should be an integer greater than 0.',
          },
          watering: {
            paverId: 'work.watering',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Watering'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Watering WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.watering should be an integer greater than 0.',
          },
          planting: {
            paverId: 'work.planting',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Seeding'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Seeding WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.planting should be an integer greater than 0.',
          },
          electricity: {
            paverId: 'work.sparks',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::GenerateElectricity'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the GenerateElectricity WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.electricity should be an integer greater than 0.',
          },
          crafting: {
            paverId: 'work.crafting',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Handcraft'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Handcraft WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.crafting should be an integer greater than 0.',
          },
          gathering: {
            paverId: 'work.gathering',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Collection'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Collection WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.gathering should be an integer greater than 0.',
          },
          woodcutting: {
            paverId: 'work.woodcutting',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Deforest'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Deforest WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.woodcutting should be an integer greater than 0.',
          },
          mining: {
            paverId: 'work.mining',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Mining'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Mining WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.mining should be an integer greater than 0.',
          },
          oilExtraction: {
            paverId: 'work.oilExtraction',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::OilExtraction'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the OilExtraction WorkSuitability stat for the player. Default is 5. No idea if this is used or not.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.oilExtraction should be an integer greater than 0.',
          },
          medicine: {
            paverId: 'work.medicine',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::ProductMedicine'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the ProductMedicine WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.medicine should be an integer greater than 0.',
          },
          cooling: {
            paverId: 'work.cooling',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Cool'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Cool WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.cooling should be an integer greater than 0.',
          },
          transport: {
            paverId: 'work.transport',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::Transport'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the Transport WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.transport should be an integer greater than 0.',
          },
          farming: {
            paverId: 'work.farming',
            parameterId: null,
            targetKey: 'CraftSpeeds.value.values',
            targetFilteredKey: 'WorkSuitability.value.value',
            findWithFilter: (spObj) => ['EPalWorkSuitability::MonsterFarm'].includes(spObj.StatusName.value),
            type: 'EnumProperty',
            info: "This governs number of points in the MonsterFarm WorkSuitability stat for the player. Default is 5.",
            validate: (val) => enableGuardrails ?
              Number.isInteger(val) && val >= 0 && val <= 10 :
              Number.isInteger(val) && val >= 0,
            validationError: 'workSpeeds.farming should be an integer greater than 0.',
          },
        },
        support: {
          parameterId: null,
          targetKey: 'Support.value',
          type: 'IntProperty',
          validate: (val) => Number.isInteger(val) && val >= 0,
          validationError: 'support should be an integer greater than 0. The ingame default is 100.',
          whatDoesThiDo: true,
        },
        unusedStatusPoint: fieldMapAliasedValues.unusedStatusPoint,
        unusedStatusPoints: fieldMapAliasedValues.unusedStatusPoint,
        unusedStatPoint: fieldMapAliasedValues.unusedStatusPoint,
        unusedStatPoints: fieldMapAliasedValues.unusedStatusPoint,
        statusPoints: {
          info: "This is the parent property for status point settings. By default, you receive an new `unusedStatusPoint` every level, which can be spent here. These will be added to your base stats (hp, weight, stamina, etc). The ingame default is 0 for all values.",
          followChildren: true, // tell iterator to follow the children keys instead of just this key
          health: {
            paverId: 'statusPoints.health',
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u6700\u5927HP', '最大HP'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            info: "This governs how many status points are spent on max HP. Each point adds +100hp to your max HP base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.maxHp should be an integer greater than 0.',
          },
          stamina: {
            paverId: 'statusPoints.stamina',
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u6700\u5927SP', '最大SP'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            info: "This governs how many status points are spent on max Stamina. Each point adds +10 to your max Stamina base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.maxSp should be an integer greater than 0.',
          },
          attack: {
            paverId: 'statusPoints.attack',
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u653b\u6483\u529b', '攻撃力'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            info: "This governs how many status points are spent on attack ('offensive power'). Each point adds +2 to your attack base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.attack should be an integer greater than 0.',
          },
          weight: {
            paverId: 'statusPoints.weight',
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u6240\u6301\u91cd\u91cf', '所持重量'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            info: "This governs how many status points are spent on carriable weight. Each point adds +50 to your weight base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.weight should be an integer greater than 0.',
          },
          captureRate: fieldMapAliasedValues.captureRate,
          catchRate: fieldMapAliasedValues.captureRate,
          workSpeed: {
            paverId: 'statusPoints.workSpeed',
            parameterId: null,
            targetKey: 'GotStatusPointList.value.values',
            targetFilteredKey: 'StatusPoint.value',
            findWithFilter: (spObj) => ['\u4f5c\u696d\u901f\u5ea6', '作業速度'].includes(spObj.StatusName.value),
            type: 'IntProperty',
            info: "This governs how many status points are spent on work speed. Each point adds +50 to your work/craft speed base value (before other modifiers). Default is 0.",
            validate: (val) => Number.isInteger(val) && val >= 0,
            validationError: 'statusPoints.workSpeed should be an integer greater than 0.',
          },
        },
        voiceId: fieldMapAliasedValues.voiceId,
        voiceid: fieldMapAliasedValues.voiceId,
      }
      break;
    case 'Player.sav':
      returnValue = {
        techPoints: fieldMapAliasedValues.techPoints,
        techPoint: fieldMapAliasedValues.techPoints,
        ancientTechPoints: fieldMapAliasedValues.ancientTechPoints,
        ancientTechPoint: fieldMapAliasedValues.ancientTechPoints,
        unlockedRecipes: fieldMapAliasedValues.unlockedRecipes,
        unlockedRecipe: fieldMapAliasedValues.unlockedRecipes,
        unlockedTech: fieldMapAliasedValues.unlockedRecipes,
        unlockedFastTravels: fieldMapAliasedValues.unlockedFastTravels,
        unlockedFastTravel: fieldMapAliasedValues.unlockedFastTravels,
        countEffigiesFound: fieldMapAliasedValues.countEffigiesFound,
        countEffigies: fieldMapAliasedValues.countEffigiesFound,
        countRelics: fieldMapAliasedValues.countEffigiesFound,
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
              val.length > 0,
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
              val.length > 0,
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



export default {
  getPlayerFieldMapByFile
};
