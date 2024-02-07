/**
 * Removes dashes, converts to uppercase, and trims whitespace from a GUID.
 * @param {string} guid 
 * @returns string
 */
const normalizeGuid = (guid) => {
  return guid?.replace(/-/g, '')?.toUpperCase().trim() || '';
};

module.exports = normalizeGuid;
