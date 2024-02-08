# **Paver**: A Palworld Save Editor
A comprehensive and extensible save editor and reporting tool for Palworld, intended to work with any version of Palworld v0.1.2.0 and above. Point it to your save directory (where your Level.sav is) and go!

This project is in early development. I've tried to make it user-friendly and safety-first (don't write changes if anything goes wrong), but **I'll always recommend making a backup of your save before using this tool.**

> Questions? Bugs? Ideas? [Join the Paver Discord](https://discord.gg/tu2rnEBWn9)

> Note: I am not, nor is this project, associated with Palworld or Pocket Pair. I'm just a fan who needed a save editor to better maintain the Palworld servers I host. This is not a commercial project, and the license (GPL-3.0) is intended to help deter commercialization of this project by others.

## Key Features
- **Save Editing, Duh!**: Add a config file with a path to your save directory and the changes you want (to the world, or to players), and Paver will make it happen! Several common changes are already supported, and more are planned and on the way (they just didn't make it into the first release).

- **Modify Player Appearance**: That's right - you can't change your appearance ingame, but you can with Paver! Change your player's body type, hair, head, name, & more (color changes coming in next feature release).

- **Built-In, Modular Reporting**: Paver can optionally run read-only (or not) and generate reports on your save, players, and more to be added. Reporting inclusions are modular and can be added to or removed from the config file as you see fit.

- **Incremental Changelog**: Reports of Paver include changelogs, so you know exactly what was changed, when, and where.

- **Highly Customizable**: The bare minimum requires only a single line in a config file (pointing to your save directory), but there are a host of options to tailor Paver to your needs (and more planned).

- **Automatic SAV<>JSON conversion**: Paver uses [@cheahjs/palworld-save-tools](https://github.com/cheahjs/palworld-save-tools) to convert your save to JSON, and back again. Paver provides the option to retain both the SAV and the JSON, making it easy for you to verify changes or add your own. Conversion is optional: as long as you already have your SAV converted to JSON, Paver can work with that too.

> Credit where it's very much due: This project is built on the shoulders of others. Paver uses the [palworld-save-tools](https://github.com/cheahjs/palworld-save-tools) library by CheahJS to convert saves to JSON and back. Without that tool, I wouldn't have bothered making this. I can't express enough gratitude for the work that went into that library. Thank you, CheahJS!


## Prerequisites

1. [@cheahjs/palworld-save-tools](https://github.com/cheahjs/palworld-save-tools) requires Python 3.9 or newer.
    - *This is not needed if your save files are already in JSON format.*
    - Windows users: You can install [Python 3.12 from the Microsoft Store](https://apps.microsoft.com/detail/9NCVDN91XZQP) or from [python.org](https://www.python.org/)
    - See the [palworld-save-tools README](https://github.com/cheahjs/palworld-save-tools) for updates and more information.

2. The `ijson` module for Python is required for the save conversion process, but **Paver will attempt to install it for you** if you don't already have it.
    - *This is not needed if your save files are already in JSON format.*
    - If you see errors about `ijson`, or see an error related to `helpers/updatePlayersInLevelSav.py`, you can workaround this by installing `ijson` yourself. Just open command prompt, type "pip install ijson", and hit enter. Then restart Paver and you should be good!

## Getting Started: Run Paver!
1) **Install any necessary prerequisites (see above).**

2) **Download the latest release from from [Releases](https://github.com/adefee/palworld-save-editor/releases/latest).** For most users, you'll want to grab the zip file, which includes an exe and some helper files. Once downloaded, extract the zip file to a location of your choice.

3) Create a config file, or run Paver once to create one for you. The config file is a JSON file that tells Paver what to do. Later, we might have a nice UI to do this for you - but in the meantime, here's a basic example to get you started:

```json
{
  "gameSaveDirectoryPath": "C:\\path\\to\\your\\save\\directory",
}
```

  - Only this first field, `gameSaveDirectoryPath` is required. This should point to a save directory (where your Level.sav is). This can be a relative path (`./`) or absolute (`C:\\your\\path`). If you use an absolute path, you will need to escape your slashes (e.g. `C:\your\path` becomes `C:\\your\\path`).

  - All other fields are optional. You can see a full list of options in [Config Options](#config-options). Reporting, changelogs, and guardrails (help make sure you don't set something wrong) are **enabled by default**.

    > Advanced: Add the config flag to the command to specify a different config file location or name. For example, `paver config=./my-config.json``.

4) Run the executable you downloaded. It will pick up your config file and start working based on what you've added. Check out the [Examples](#config-examples) to see some common use cases.

## Advanced: Running from Source
If you want to run Paver as a Node app, feel free! You'll need to have ateast Node.js installed, and then you can run the following commands to get started:

```bash
yarn # Installs dependencies
yarn start # Runs `node .`
```

For troubleshooting, you may find `process.env.DEBUG` useful, in addition to some of the config file options.

## Config Examples
### Basic changes to a single player
Let's give player "Lent" 42 Technology Points and add 10 Stat Points to his HP. Also, make sure he goes to leg day - set his leg size to 0.8.
```json
{
  "gameSaveDirectoryPath": "C:\\path\\to\\your\\save\\directory",
  "changesToMake": {
    "enableGuardrails": true,
    "world": {},
    "players": [
      {
        "handle": "Lent",
        "techPoints": 42,
        "statusPoints": {
          "maxHp": 10,
        },
        "appearance": {
          "bodyType": "TypeB",
          "hairType": "type12",
          "legSize": 0.5
        }
      }
    ]
  }
}
```

Note the `enableGuardrails` option. This is enabled by default, and it will help make sure you don't set something wrong (for example, make sure you don't set legsize to "fdjsklfajs"). If you're confident in your changes, or you want to play with values that go beyond the game defaults (level 100, anyone?), just set this to false.

### Generate a read-only report of your save
Easy! Let's take out the `changesToMake` object and add a `reporting` object. There's a variety of options available, here's a few:
```json
{
  "gameSaveDirectoryPath": "./my-awesome-palworld-save",
  "reporting": {
    "export": true,
    "exportPath": "./reports",
    "showSummary": true,
    "showCapturedPals": true,
    "showPlayerData": true,
    "showPlayerUnlockedRecipes": true,
    "showPlayerAppearance": true,
  },
}
```

Normally, and by default, you'll want `export: true`. Setting this false will increase the logs you see in the console, but it won't save any reports to disk (and the report output in the console will be a bit messy).

### Level up "Lent" and change his name to "Seraph". Bump Ghost's capture rate, too!
This has a a bit more nuance to it, but also easy! Note that "level" is mostly just a number in Palworld. Your total experience also needs to change, or you'll receive future XP as if you're a different level. For example, if we set level 1 "Lent" to level 40, he'll be 40 but only gain XP as if he's level 1 - meaning going from 40 to 41 will take the same amount of XP as going from 1 to 40.

This is probably not what we usually want, right? No problem - we calculate the exp for you! If you set the `level` field and *do not* specify `exp`, we will calculate and add the exp for you. For those wanting more control or to try things out, you can also set `exp` yourself and Paver will trust your judgment.
```json
{
  "gameSaveDirectoryPath": "./my-awesome-palworld-save",
  "changesToMake": {
    "enableGuardrails": true,
    "world": {
      
    },
    "players": [
      {
        "guid": "e1337m8e-0000-0000-0000-000000000000",
        "handle": "Seraph",
        "level": 35,
      },
      {
        "handle": "Ghostpixel",
        "statusPoints": {
          "catchRate": 9001,
        },
      }
    ]
  }
}
```
Before we continue, let's talk about names real quick. There are two fields we use for identifying a target user for changes: `handle` and `guid`. The former is what you see in-game, and the latter is a unique identifier for the player that doesn't typically change. Most of the time, you can use `handle` - but if you want to change someone's handle, you'll need to specify their `guid`, too. If you're not sure what a player's `guid` is, you can find it in the reports Paver generates.

> Pro Tip: If you have multiple players with the same name, Paver will tell you it's indeterminate and will not make any changes to your save - we don't want to modify the wrong player! In such cases, you'll want to specify the `guid` field of the target player.

Oh, and Ghost's capture rate? *It's OVER 9000!* Fun fact: We tried 5000 once and he had 100% capture rate with basic spheres on endgame bosses! On a more serious note, astute observers may have noticed that `catchRate` is inside of Status Points, where we also put HP, weight, stamina, etc. We were surprised, too, but this is how the save file organizes it. In cases like this, we've tried to keep our structure as close to that of the save file as possible so.

## Config Options
Below is a list of all currently available options for the `config.json` file. All fields other than `gameSaveDirectoryPath` are optional; the values you see below are the defaults (by us or Palword). Below is an example with all currently possible options specified; look below that for a table/list that dives into the purpose of each.

### Quick View

```json
{
  "gameSaveDirectoryPath": "C:\\path\\to\\your\\save\\directory",
  "skipSavJsonConversion": false,
  "cheahJsToolsInstallPath": "./helpers/cheahjs-save-tools",
  "cheahJsToolsVersion": "0.18.0",
  "cheahJsToolsDownloadUrl": "https://github.com/cheahjs/palworld-save-tools/releases/download/v0.18.0/palworld-save-tools-windows-v0.18.0.zip",
  "useCustomDataStorePath": false,
  "cleanUpDataStore": true,
  "reporting": {
    "export": true,
    "exportPath": "./reports",
    "showSummary": true,
    "showCapturedPals": true,
    "showPlayerData": true,
  },
  "changesToMake": {
    "enableGuardrails": true,
    "world": {
      "soon":"Broader world changes will be added here and are coming soon!"
    },
    "players": [
      {
        "guid": "e1337m8e-0000-0000-0000-000000000000",
        "handle": "Lent",
        "level": 42,
        "exp": 123456789,
        "techPoints": 250,
        "ancientTechPoints": 100,
        "unlockedRecipes": [
          "Workbench",
          "Product_Axe_Grade_01",
          "Product_Pickaxe_Grade_01",
          "HandTorch",
        ],
        "unlockedFastTravels": [
          "soon - fast travels will be added here soon!"
        ],
        "countEffigiesFound": 0,
        "currentHp": 50000,
        "maxHp": 50000,
        "maxSp": 50000,
        "hunger": 100,
        "sanityValue": 100,
        "isPlayer": true,
        "workSpeed": 100,
        "support": 100,
        "unusedStatusPoint": 0,
        "statusPoints": {
          "maxHp": 0,
          "maxSp": 0,
          "attack": 0,
          "weight": 0,
          "catchRate": 0,
          "workSpeed": 0,
        },
        "appearance": {
          "bodyType": "TypeB",
          "torsoSize": 0.5,
          "armSize": 0.5,
          "legSize": 0.5,
          "headType": "type1",
          "hairType": "type1",
          "hairColor": "soon - colors will be added here soon!",
          "browColor": "soon - colors will be added here soon!",
          "bodyColor": "soon - colors will be added here soon!",
          "bodySubsurfaceColor": "soon - colors will be added here soon!",
          "eyeColor": "soon - colors will be added here soon!",
          "eyeMaterialName": "Type001",
        },
        "voiceId": 1,
      }
    ]
  },
}
```

### Options Rundown
Deeper details on each option and what it does will be added here soon.


## Planned Improvements & Features
I'll be adding to this list soon (I'm sleepy), but there are quite a lot of things I'd expect to add to this project if people find it useful. Here's a few things I'm thinking about:
- Full appearance options
- Inventory & base editing
- In reports, scan world & players for potential issues (chars in name that could break things), VAC/global ban lists, evidence of cheating, etc.
- Better abstraction and clean up the code - it's fresh out of hackathon mode, and it shows.
- More guardrails and safety checks, more options with saving.
- Potential automated/rolled-up RCON + backup + save edit + restart server functionality.
- Incremental and/or Git-style rollbacks of changes.
- Way better documentation
- Features voted on by users/community.
