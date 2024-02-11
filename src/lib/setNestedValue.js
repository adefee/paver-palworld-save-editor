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

    // Check if we need to create a new object or a specific structure
    if (!currentObject[key]) {
      // If structure info is provided for this level, use it to create the structure
      if (fieldMap.structure && fieldMap.structure[i]) {
        currentObject[key] = { ...fieldMap.structure[i] }; // Use spread to clone structure if needed
      } else {
        currentObject[key] = {};
      }
    }

    currentObject = currentObject[key];
  }

  const lastKey = keys[keys.length - 1];
  oldValue = currentObject[lastKey];

  // Handle setting new value and possibly additional metadata
  if (!oldValue) {
    // Check if there's a structure defined for the new key
    if (fieldMap.structure && fieldMap.structure[keys.length - 1]) {
      // Merge the structure with the current object, ensuring new value is set
      Object.assign(currentObject, { ...fieldMap.structure[keys.length - 1], [lastKey]: newValue });
    } else {
      // No specific structure, proceed as before
      currentObject['id'] = fieldMap?.parameterId || null;
      currentObject[lastKey] = newValue;
      currentObject['type'] = fieldMap?.type;
    }
  } else {
    currentObject[lastKey] = newValue;
  }

  return {
    modifiedObject: objectToModify,
    oldValue: oldValue || 'Not Set',
  };
}

module.exports = setNestedValue;
