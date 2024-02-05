/**
 * 
 * @param {object} obj Target object to search against
 * @param {string} path Path to the target array in dot notation, e.g. `foo.bar.baz`
 * @param {function} findFn The target find function to run. We'll use this w/ both findIndex() and find().
 * @returns {[number, any] | undefined} [index, element] or undefined if not found
 */
const findInNestedObject = (obj, path, findFn) => {
  const pathParts = path.split('.');
  let current = obj;

  // Safely traverse the nested object
  for (const part of pathParts) {
    if (current[part] === undefined) {
      // If any part of the path doesn't exist, exit early
      return undefined;
    }
    current = current[part];
  }

  // Ensure the final part of the path is an array
  if (!Array.isArray(current)) {
    throw new Error("The final target is not an array.");
  }

  // Perform the find operation
  return [
    current.findIndex(findFn), // Index of the first matching element
    current.find(findFn) // The first matching element
  ];
}

module.exports = findInNestedObject;
