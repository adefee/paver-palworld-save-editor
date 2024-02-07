/**
 * Given an object and target path (dot notation), set the value of the target path
 * @param {object} objectToModify target obj to modify, e.g. `{ foo: { bar: 1 } }`
 * @param {string} targetPath dot notation of path `foo.bar`
 * @param {*} newValue New value to set, e.g. 2. Would result in `{ foo: { bar: 2 } }` in above example.
 * @returns obj {modifiedObject, oldValue} 
 */
const setNestedValue = (objectToModify, fieldMap, newValue) => {
  const keys = fieldMap.targetKey.split('.');
  let currentObject = objectToModify;
  let oldValue = null;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!currentObject[key]) {
      currentObject[key] = {};
    }

    currentObject = currentObject[key];
  }

  const lastKey = keys[keys.length - 1];
  // Record the old value and return it and log.
  oldValue = currentObject[lastKey];

  if (!oldValue) {
    // There was no previous value, so we need to add some add'l meta to this new property
    // Seems like id is (always?) null here.
    // Set additional properties at the same level
    currentObject['id'] = fieldMap?.parameterId || null;
    currentObject[lastKey] = newValue;
    currentObject['type'] = fieldMap?.type;
  } else {
    currentObject[keys[keys.length - 1]] = newValue;
  }

  return {
    modifiedObject: objectToModify,
    oldValue: oldValue || 'Not Set',
  };
}

module.exports = setNestedValue;
