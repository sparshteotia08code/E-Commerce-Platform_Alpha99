let memoryStore = {};

/**
 * Get cached data
 * @param {string} key 
 */
const getCache = async (key) => {
  const item = memoryStore[key];
  if (!item) return null;

  if (Date.now() > item.expiry) {
    delete memoryStore[key];
    return null;
  }

  try {
    return JSON.parse(item.value);
  } catch (e) {
    return null;
  }
};

/**
 * Set cache data
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
const setCache = async (key, value, ttlSeconds = 300) => {
  memoryStore[key] = {
    value: JSON.stringify(value),
    expiry: Date.now() + (ttlSeconds * 1000)
  };
};

/**
 * Clear cached keys
 * @param {string} prefix 
 */
const clearCache = async (prefix = '') => {
  if (!prefix) {
    memoryStore = {};
    return;
  }
  
  Object.keys(memoryStore).forEach(key => {
    if (key.startsWith(prefix)) {
      delete memoryStore[key];
    }
  });
};

module.exports = {
  getCache,
  setCache,
  clearCache
};
