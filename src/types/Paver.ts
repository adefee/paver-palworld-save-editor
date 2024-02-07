export interface IPaverConfigPlayerChanges {
  guid?: string,
  handle?: string,
  level?: number,
  exp?: number,
  techPoints?: number,
  ancientTechPoints?: number,
  unlockedRecipes?: string[],
  unlockedFastTravels?: [
    "soon - fast travels will be added here soon!"
  ],
  relicsInPossession?: 0,
  currentHp?: number,
  maxHp?: number,
  maxSp?: number,
  hunger?: number,
  sanityValue?: number,
  isPlayer?: true,
  workSpeed?: number,
  support?: number,
  unusedStatusPoint?: number,
  statusPoints?: {
    maxHp?: number,
    maxSp?: number,
    attack?: number,
    weight?: number,
    catchRate?: number,
    workSpeed?: number,
  },
  appearance?: {
    bodyType?: "TypeA" | "TypeB" | string,
    torsoSize?: number,
    armSize?: number,
    legSize?: number,
    headType?: "type1" | string,
    hairType?: "type1" | string,
    hairColor?: "soon - colors will be added here soon!",
    browColor?: "soon - colors will be added here soon!",
    bodyColor?: "soon - colors will be added here soon!",
    bodySubsurfaceColor?: "soon - colors will be added here soon!",
    eyeColor?: "soon - colors will be added here soon!",
    eyeMaterialName?: "Type001" | string,
  },
  voiceId?: number,
}

export interface IPaverConfig {
  /**
   * Advanced settings to govern Paver's SAV<>JSON behavior. You probably will not need to modify these settings, unless you want to use a specific version CheahJs' tools, troubleshoot, etc.
   */
  savToJsonConveration?: {
    cheahJsToolsInstallPath?: string,
    cheahJsToolsVersion?: string,
    cheahJsToolsDownloadUrl?: string,
    convertFreshEveryRun?: boolean,
    cleanUpJsonAfterConversion?: boolean,
  },
  /**
   * If true, the Paver will skip the conversion of the .sav files to .json files. Thusly, we expect the JSON versions to already exist.
   */
  skipSavJsonConversion?: boolean,
  cleanUpDataStore?: boolean,
  gameSaveDirectoryPath: string,
  reporting?: {
    export?: boolean,
    exportPath?: "./reports" | string,
    showSummary?: boolean,
    showCapturedPals?: boolean,
    showPlayerData?: boolean,
    showPlayerUnlockedRecipes?: boolean,
    showPlayerAppearance?: boolean,
  },
  changesToMake?: {
    enableGuardrails?: boolean,
    world?: {
    },
    players?: IPaverConfigPlayerChanges[]
  }
}

export interface IChangelogEntry {
  entity: 'player' | 'world' | 'pal' | 'recipe' | 'item' | 'entity' | 'other',
  entityId: string,
  file: 'Level.sav' | 'Player.sav' | 'LevelMeta.sav' | 'WorldOptions.sav',
  field: string,
  keyInFile: string,
  oldValue?: any,
  newValue: any,
  unknownField?: string,
  notSupported?: string,
  validationPassed?: boolean,
  validationError?: string,
  notes?: string,
}
