const fs = require('fs');
const path = require('path');

/**
 * Reads the content of config.json and returns it as an object.
 * @returns {Object|null} The content of the JSON file as an object, or null if the file does not exist.
 */
function getAppConfig(givenPath) {
  let configPath = givenPath || '../config.json';

  if (fs.existsSync(configPath)) {
    try {
      const configFile = fs.readFileSync(configPath, 'utf8');
      if (configFile) {
        const config = JSON.parse(configFile)
        if (config) return config;
      }
      return null;
    } catch (error) {
      console.error("Error reading JSON file:", error.message);
      return null;
    }
  } else {
    console.log("config.json not found.");
    return null;
  }
}

module.exports = getAppConfig;
