const copyObject = (dest, src) => {
  Object.keys(src).forEach((key) => {
    // eslint-disable-next-line no-param-reassign
    dest[key] = src[key];
  });
  return dest;
}

module.exports = copyObject;
