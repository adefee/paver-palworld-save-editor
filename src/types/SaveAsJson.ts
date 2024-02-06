/**
 * Header of the save file, containing metadata about the save file.
 */
export interface ISaveAsJsonHeader {
  magic?: number,
  save_game_version?: number,
  package_file_version_ue4?: number,
  package_file_version_ue5?: number,
  engine_version_major?: number,
  engine_version_minor?: number,
  engine_version_patch?: number,
  engine_version_changelist?: number,
  engine_version_branch?: number,
  custom_version_format?: number,
  custom_versions?: [
    string,
    number
  ][],
  save_game_class_name?: string,
  save_edited?: {
    lastEdited: string,
    toolsUsed: string[]
  },
}

/**
 * The datafields available on a Player or Pal
 */
export interface ISaveAsJsonPalPlayerDataFields {
  Level?: {
    id?: null
    value?: number,
    type?: "IntProperty"
  },
  Exp?: {
    id?: null
    value?: number,
    type?: "IntProperty"
  },
  NickName?: {
    id?: null
    value?: string,
    type?: "StrProperty"
  },
  HP?: {
    struct_type?: "FixedPoint64",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null
    value?: {
      Value?: {
        id?: null
        value?: number,
        type?: "Int64Property"
      }
    },
    type?: "StructProperty"
  },
  FullStomach?: {
    id?: null
    value?: number,
    type?: "FloatProperty"
  },
  IsPlayer?: {
    value?: boolean,
    id?: null
    type?: "BoolProperty"
  },
  MaxHP?: {
    struct_type?: "FixedPoint64",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null
    value?: {
      Value?: {
        id?: null
        value?: number,
        type?: "Int64Property"
      }
    },
    type?: "StructProperty"
  },
  Support?: {
    id?: null
    value?: number,
    type?: "IntProperty"
  },
  CraftSpeed?: {
    id?: null
    value?: number,
    type?: "IntProperty"
  },
  CraftSpeeds?: {
    array_type?: "StructProperty",
    id?: null
    value?: {
      prop_name?: "CraftSpeeds",
      prop_type?: "StructProperty",
      values?: [
        /**
         * Kindling/Fire Starting
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::EmitFlame"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Watering
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Watering"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Seeding (for farming)
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Seeding"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Electricity Generation
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::GenerateElectricity"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Crafting Speed / Handicraft
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Handcraft"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Gathering
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Collection"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Woodcutting?
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Deforest"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Mining
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Mining"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Oil Extraction?
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::OilExtraction"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Medicine
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::ProductMedicine"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Cooling
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Cool"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Transport
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::Transport"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Farming
         */
        {
          WorkSuitability?: {
            id?: null
            value?: {
              type?: "EPalWorkSuitability",
              value?: "EPalWorkSuitability::MonsterFarm"
            },
            type?: "EnumProperty"
          },
          Rank?: {
            id?: null
            value?: number,
            type?: "IntProperty"
          }
        }
      ],
      type_name?: "PalWorkSuitabilityInfo",
      id: "00000000-0000-0000-0000-000000000000" | string
    },
    type?: "ArrayProperty"
  },
  /**
   * List of status point values.
   * Some of these originally (pre v0.1.2.0) had non-unicode-encoded characters. For backwards compatibility, we need to look for both the unicode and non-unicode versions of these strings.
   */
  GotStatusPointList?: {
    array_type?: "StructProperty",
    id?: null
    value?: {
      prop_name?: "GotStatusPointList",
      prop_type?: "StructProperty",
      values?: [
        /**
         * HP Stat
         */
        {
          StatusName?: {
            id?: null
            value?: "\u6700\u5927HP" | "最大HP",
            type?: "NameProperty"
          },
          StatusPoint?: {
            id?: null
            /**
             * Number of points in HP
             */
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Stamina Stat
         */
        {
          StatusName?: {
            id?: null
            value?: "\u6700\u5927SP" | "最大SP",
            type?: "NameProperty"
          },
          StatusPoint?: {
            id?: null
            /**
             * Number of points in Stamina
             */
            value?: number,
            type?: "IntProperty"
          }
        },
        /** Attack Power Stat */
        {
          StatusName?: {
            id?: null
            value?: "\u653b\u6483\u529b" | "攻撃力",
            type?: "NameProperty"
          },
          StatusPoint?: {
            id?: null
            /**
             * Number of points in Attack Power
             */
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Weight Stat
         */
        {
          StatusName?: {
            id?: null
            value?: "\u6240\u6301\u91cd\u91cf" | "所持重量",
            type?: "NameProperty"
          },
          StatusPoint?: {
            id?: null
            /**
             * Number of points in Weight
             */
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Catch/Capture Rate
         */
        {
          StatusName?: {
            id?: null
            value?: "\u6355\u7372\u7387" | "捕獲率",
            type?: "NameProperty"
          },
          StatusPoint?: {
            id?: null
            /**
             * Number of points in Catch/Capture Rate
             */
            value?: number,
            type?: "IntProperty"
          }
        },
        /**
         * Work/Craft Speed
         */
        {
          StatusName?: {
            id?: null
            value?: "\u4f5c\u696d\u901f\u5ea6" | "作業速度",
            type?: "NameProperty"
          },
          StatusPoint?: {
            id?: null
            /**
             * Number of points in Work/Craft Speed
             */
            value?: number,
            type?: "IntProperty"
          }
        }
      ],
      type_name?: "PalGotStatusPoint",
      id: "00000000-0000-0000-0000-000000000000" | string
    },
    type?: "ArrayProperty"
  },
  DecreaseFullStomachRates?: {
    struct_type?: "FloatContainer",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null
    value?: any, // Haven't seen this with a value in a save yet, not sure.
    type?: "StructProperty"
  },
  CraftSpeedRates?: {
    struct_type?: "FloatContainer",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null
    value?: any, // Haven't seen this with a value in a save yet, not sure.
    type?: "StructProperty"
  },
  LastJumpedLocation?: {
    struct_type?: "Vector",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null
    value?: {
      x: number,
      y: number,
      z: number
    },
    type?: "StructProperty"
  },
  VoiceID?: {
    id?: null
    value?: number,
    type?: "IntProperty"
  },
  /**
   * These are available to Pals, but not players.
   */
  CharacterID?: {
    id?: null,
    value?: string, // "ChickenPal", etc
    type?: "NameProperty"
  },
  Gender?: {
    id?: null,
    value?: {
      type?: "EPalGenderType",
      value?: "EPalGenderType::Male" | "EPalGenderType::Female"
    },
    type?: "EnumProperty"
  },
  EquipWaza?: {
    array_type?: "EnumProperty",
    id?: null,
    value?: {
      values?: string[]
    },
    type?: "ArrayProperty"
  },
  MasteredWaza?: {
    array_type?: "EnumProperty",
    id?: null,
    value?: {
      values?: string[]
    },
    type?: "ArrayProperty"
  },
  Talent_HP?: {
    id?: null,
    value?: number,
    type?: "IntProperty"
  },
  Talent_Melee?: {
    id?: null,
    value?: number,
    type?: "IntProperty"
  },
  Talent_Shot?: {
    id?: null,
    value?: number,
    type?: "IntProperty"
  },
  Talent_Defense?: {
    id?: null,
    value?: number,
    type?: "IntProperty"
  },
  PassiveSkillList?: {
    array_type?: "NameProperty",
    id?: null,
    value?: {
      values?: string[]
    },
    type?: "ArrayProperty"
  },
  MP?: {
    struct_type?: "FixedPoint64",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null,
    value?: {
      Value?: {
        id?: null,
        value?: number,
        type?: "Int64Property"
      }
    },
    type?: "StructProperty"
  },
  OwnedTime?: {
    struct_type?: "DateTime",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null,
    value?: number,
    type?: "StructProperty"
  },
  OwnerPlayerUId?: {
    struct_type?: "Guid",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null,
    /**
     * GUID of player that owns this Pal
     */
    value?: string,
    type?: "StructProperty"
  },
  OldOwnerPlayerUIds?: {
    array_type?: "StructProperty",
    id?: null,
    value?: {
      prop_name?: "OldOwnerPlayerUIds",
      prop_type?: "StructProperty",
      /**
       * Haven't seen this in many saves, this is probably array of strings
       */
      values?: string[],
      type_name?: "Guid",
      id: "00000000-0000-0000-0000-000000000000" | string
    },
    type?: "ArrayProperty"
  },
  SanityValue?: {
    id?: null,
    value?: number,
    type?: "FloatProperty"
  },
  EquipItemContainerId?: {
    struct_type?: "PalContainerId",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null,
    value?: {
      ID?: {
        struct_type?: "Guid",
        struct_id?: "00000000-0000-0000-0000-000000000000" | string,
        id?: null,
        value?: string,
        type?: "StructProperty"
      }
    },
    type?: "StructProperty"
  },
  SlotID?: {
    struct_type?: "PalCharacterSlotId",
    struct_id?: "00000000-0000-0000-0000-000000000000" | string,
    id?: null,
    value?: {
      ContainerId?: {
        struct_type?: "PalContainerId",
        struct_id?: "00000000-0000-0000-0000-000000000000" | string,
        id?: null,
        value?: {
          ID?: {
            struct_type?: "Guid",
            struct_id?: "00000000-0000-0000-0000-000000000000" | string,
            id?: null,
            /**
             * Likely a container id
             */
            value?: string,
            type?: "StructProperty"
          }
        },
        type?: "StructProperty"
      },
      SlotIndex?: {
        id?: null,
        value?: number,
        type?: "IntProperty"
      }
    },
    type?: "StructProperty"
  }
}

/**
 * Key-Value pair for a player's data in the save file.
 * The key will included (nested) the player's GUID, and the value will include the player's ISaveAsJsonPalPlayerDataFields data.
 */
export interface ISaveAsJsonPalPlayerKeyValuePair {
  key?: {
    PlayerUId?: {
      struct_type?: "Guid",
      struct_id?: "00000000-0000-0000-0000-000000000000" | string,
      id: null,
      /**
       * If this is a player will be the GUID of the player.
       * Otherwise, will be 000000-etc
       */
      value: string,
      type: "StructProperty"
    },
    InstanceId?: {
      struct_type?: "Guid",
      /**
       * This is the instance ID. Often this is empty (000's)
       */
      struct_id?: "00000000-0000-0000-0000-000000000000" | string,
      id: null,
      value: string,
      type: "StructProperty"
    },
    DebugName?: {
      id: null,
      value: string,
      type: "StrProperty"
    }
  },
  value?: {
    RawData?: {
      array_type?: "ByteProperty",
      id?: null,
      value?: {
        object?: {
          SaveParameter?: {
            struct_type?: "PalIndividualCharacterSaveParameter",
            struct_id?: string,
            type?: "StructProperty",
            id?: null,
            value: ISaveAsJsonPalPlayerDataFields,
          }
        }
      }
    }
  }
}

/**
 * Main beef of the save file, containing properties and data.
 */
export interface ISaveAsJsonProperties {
  Version?: {
    id: null,
    value: number
    type: "IntProperty",
  },
  Timestamp?: {
    struct_type?: "DateTime",
    struct_id?: string,
    id: null,
    value: number,
    type: "StructProperty",
  },
  worldSaveData?: {
    struct_type?: "StructProperty",
    struct_id?: string,
    id?: null,
    type?: "StructProperty",
    value?: {
      CharacterSaveParameterMap?: {
        key_type: "StructProperty",
        value_type: "StructProperty",
        key_struct_type: "StructProperty",
        value_struct_type: "StructProperty",
        id: null,
        value?: ISaveAsJsonPalPlayerKeyValuePair[],
      },
      // Not yet explored or available to be modified in Paver.
      MapObjectSaveData?: {
        [key: string]: any,
      },
      // Not yet explored or available to be modified in Paver.
      FoliageGridSaveDataMap?: {
        [key: string]: any,
      },
      // Not yet explored or available to be modified in Paver.
      MapObjectSpawnerInStageSaveData?: {
        [key: string]: any,
      },
      // Not yet explored or available to be modified in Paver.
      BaseCampSaveData?: {
        [key: string]: any,
      },
      // Not yet explored or available to be modified in Paver.
      ItemContainerSaveData?: {
        [key: string]: any,
      },
      // Not yet explored or available to be modified in Paver.
      DynamicItemSaveData?: {
        [key: string]: any,
      },
      // Not yet explored or available to be modified in Paver.
      CharacterContainerSaveData?: {
        [key: string]: any,
      },
      // Not yet explored or available to be modified in Paver.
      GroupSaveDataMap?: {
        [key: string]: any,
      },
      // This seems relatively static & straightforward, so no optional keys here.
      GameTimeSaveData?: {
        struct_type?: "PalGameTimeSaveData",
        struct_id?: string,
        id: null,
        value?: {
          GameDateTimeTicks: {
            id: null,
            value: number,
            type: "Int64Property"
          },
          RealDateTimeTicks: {
            id: null,
            value: number,
            type: "Int64Property"
          }
        },
        type: "StructProperty"
      },
      // Not yet explored or available to be modified in Paver.
      EnemyCampSaveData?: {
        struct_type?: "PalEnemyCampSaveData",
        struct_id?: string,
        type?: "StructProperty",
        id?: null,
        value?: {
          EnemyCampStatusMap?: {
            key_type?: "NameProperty",
            value_type?: "StructProperty",
            key_struct_type?: null,
            value_struct_type?: "StructProperty",
            id?: null,
            value?: {
              key?: string,
              value?: {
                // TODO: Explore this  more and fill out the structure.
                [key: string]: any,
              }
            }[],
            type: "MapProperty"
          }
        },
      },
      // Not yet explored or available to be modified in Paver.
      DungeonPointMarkerSaveData?: {
        array_type?: "StructProperty",
        type?: "ArrayProperty",
        id?: null,
        value?: {
          prop_name: "DungeonPointMarkerSaveData",
          prop_type: "StructProperty",
          values?: {
            // TODO: Explore & fill this out when we get time.
            [key: string]: any
          }[]
        },
      },
      // Not yet explored or available to be modified in Paver.
      DungeonSaveData?: {
        array_type?: "StructProperty",
        type?: "ArrayProperty",
        id?: null,
        value?: {
          prop_name: "DungeonSaveData",
          prop_type: "StructProperty",
          values?: {
            // TODO: Explore & fill this out when we get time.
            [key: string]: any
          }[]
        },
      },
    }
  }
}

/**
 * For now, trailer appears just to be a string (presumably needed by CheahJS's tools as caboose)
 */
export type ISaveAsJsonTrailer = string;


/**
 * Interface matching our expected incoming JSON structure for a converted save file
 * All fields currently optional, as we're dependent on other tools for this and not all fields may always be present.
 */
export interface ISaveAsJson {
  header?: ISaveAsJsonHeader,
  properties?: ISaveAsJsonProperties,
  trailer?: ISaveAsJsonTrailer,
}

/**
 * The actual player data field inside of a Players/<guid>.sav.json file
 */
export interface ISaveAsPlayerJsonPlayerDataField {
  PlayerUId?: {
    struct_type?: "Guid",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    /**
     * The GUID of the player
     */
    value?: string,
    type: "StructProperty"
  },
  IndividualId: {
    struct_type?: "PalInstanceID",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    value?: {
      PlayerUId?: {
        struct_type?: "Guid",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        /**
         * The GUID of the player
         */
        value?: string,
        type: "StructProperty"
      },
      InstanceId: {
        struct_type?: "Guid",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        // Instance ID of
        value?: string,
        type: "StructProperty"
      }
    },
    type: "StructProperty"
  },
  LastTransform: {
    struct_type?: "Transform",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    value?: {
      Rotation: {
        struct_type?: "Quat",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          "x": number,
          "y": number,
          "z": number,
          "w": number
        },
        type: "StructProperty"
      },
      Translation?: {
        struct_type?: "Vector",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          "x": number,
          "y": number,
          "z": number
        },
        type: "StructProperty"
      }
    },
    type: "StructProperty"
  },
  PlayerCharacterMakeData?: {
    struct_type?: "PalPlayerDataCharacterMakeInfo",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    value?: {
      BodyMeshName?: {
        id: null,
        value?: "TypeA",
        type: "NameProperty"
      },
      HeadMeshName?: {
        id: null,
        value?: "type1",
        type: "NameProperty"
      },
      HairMeshName?: {
        id: null,
        value?: "type1",
        type: "NameProperty"
      },
      HairColor?: {
        struct_type?: "LinearColor",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          "r": number,
          "g": number,
          "b": number,
          "a": number
        },
        type: "StructProperty"
      },
      BrowColor?: {
        struct_type?: "LinearColor",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          "r": number,
          "g": number,
          "b": number,
          "a": number
        },
        type: "StructProperty"
      },
      BodyColor?: {
        struct_type?: "LinearColor",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          "r": number,
          "g": number,
          "b": number,
          "a": number
        },
        type: "StructProperty"
      },
      BodySubsurfaceColor?: {
        struct_type?: "LinearColor",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          "r": number,
          "g": number,
          "b": number,
          "a": number
        },
        type: "StructProperty"
      },
      EyeColor?: {
        struct_type?: "LinearColor",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          "r": number,
          "g": number,
          "b": number,
          "a": number
        },
        type: "StructProperty"
      },
      EyeMaterialName?: {
        id: null,
        value?: "Type001",
        type: "NameProperty"
      },
      VoiceID?: {
        id: null,
        value?: number,
        type: "IntProperty"
      }
    },
    type: "StructProperty"
  },
  OtomoCharacterContainerId?: {
    struct_type?: "PalContainerId",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    value?: {
      ID?: {
        struct_type?: "Guid",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        /**
         * GUID of Otomo character Id
         */
        value?: string,
        type: "StructProperty"
      }
    },
    type: "StructProperty"
  },
  inventoryInfo?: {
    struct_type?: "PalPlayerDataInventoryInfo",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    value?: {
      CommonContainerId?: {
        struct_type?: "PalContainerId",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          ID?: {
            struct_type?: "Guid",
            struct_id?: "00000000-0000-0000-0000-000000000000",
            id: null,
            /**
             * Id of corresponding container
             */
            value?: string,
            type: "StructProperty"
          }
        },
        type: "StructProperty"
      },
      DropSlotContainerId?: {
        struct_type?: "PalContainerId",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          ID?: {
            struct_type?: "Guid",
            struct_id?: "00000000-0000-0000-0000-000000000000",
            id: null,
            /**
             * Id of corresponding container
             */
            value?: string,
            type: "StructProperty"
          }
        },
        type: "StructProperty"
      },
      EssentialContainerId?: {
        struct_type?: "PalContainerId",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          ID?: {
            struct_type?: "Guid",
            struct_id?: "00000000-0000-0000-0000-000000000000",
            id: null,
            /**
             * Id of corresponding container
             */
            value?: string,
            type: "StructProperty"
          }
        },
        type: "StructProperty"
      },
      WeaponLoadOutContainerId?: {
        struct_type?: "PalContainerId",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          ID?: {
            struct_type?: "Guid",
            struct_id?: "00000000-0000-0000-0000-000000000000",
            id: null,
            /**
             * Id of corresponding container
             */
            value?: string,
            type: "StructProperty"
          }
        },
        type: "StructProperty"
      },
      PlayerEquipArmorContainerId?: {
        struct_type?: "PalContainerId",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          ID?: {
            struct_type?: "Guid",
            struct_id?: "00000000-0000-0000-0000-000000000000",
            id: null,
            /**
             * Id of corresponding container
             */
            value?: string,
            type: "StructProperty"
          }
        },
        type: "StructProperty"
      },
      FoodEquipContainerId?: {
        struct_type?: "PalContainerId",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        value?: {
          ID?: {
            struct_type?: "Guid",
            struct_id?: "00000000-0000-0000-0000-000000000000",
            id: null,
            /**
             * Id of corresponding container
             */
            value?: string,
            type: "StructProperty"
          }
        },
        type: "StructProperty"
      }
    },
    type: "StructProperty"
  },
  /**
   * Availble technology points.
   */
  TechnologyPoint?: {
    id: null,
    value?: number,
    type: "IntProperty"
  },
  /**
   * Ancient technology points
   */
  bossTechnologyPoint?: {
    id: null,
    value?: number,
    type: "IntProperty"
  },
  /**
   * Unlocked recipes
   */
  UnlockedRecipeTechnologyNames?: {
    "array_type": "NameProperty",
    id: null,
    value?: {
      values: string[]
    },
    type: "ArrayProperty"
  },
  PalStorageContainerId?: {
    struct_type?: "PalContainerId",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    value?: {
      ID?: {
        struct_type?: "Guid",
        struct_id?: "00000000-0000-0000-0000-000000000000",
        id: null,
        /**
         * Id of corresponding container
         */
        value?: string,
        type: "StructProperty"
      }
    },
    type: "StructProperty"
  },
  RecordData?: {
    struct_type?: "PalLoggedinPlayerSaveDataRecordData",
    struct_id?: "00000000-0000-0000-0000-000000000000",
    id: null,
    value?: {
      /**
       * Unlocked fast travel points
       */
      FastTravelPointUnlockFlag?: {
        "key_type": "NameProperty",
        "value_type": "BoolProperty",
        "key_struct_type": null,
        "value_struct_type": null,
        id: null,
        value?: { key: string, value: boolean }[],
        type: "MapProperty"
      },
      /**
       * Number of effigy points (unspent)
       */
      RelicPossessNum?: {
        value?: number,
        id: null,
        type: "IntProperty"
      }
    },
    type: "StructProperty"
  },
  bIsSelectedInitMapPoint?: {
    value?: boolean,
    id: null,
    type: "BoolProperty"
  }
}


/**
 * Main beef of the save file, containing properties and data.
 */
export interface ISaveAsPlayerJsonProperties {
  Version?: {
    id: null,
    value: number
    type: "IntProperty",
  },
  Timestamp?: {
    struct_type?: "DateTime",
    struct_id?: string,
    id: null,
    value: number,
    type: "StructProperty",
  },
  SaveData?: {
    struct_type?: "StructProperty",
    struct_id?: string,
    id?: null,
    type?: "StructProperty",
    value?: ISaveAsPlayerJsonPlayerDataField
  }
}

/**
 * Interface matching expected JSON structure for Player/<guid>.sav files.
 */
export interface IPlayerSaveAsJson {
  header?: ISaveAsJsonHeader,
  properties?: ISaveAsPlayerJsonProperties,
  trailer?: ISaveAsJsonTrailer,
}
