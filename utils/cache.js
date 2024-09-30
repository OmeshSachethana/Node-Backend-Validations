// utils/cache.js

const cache = {}; // In-memory cache object

// Function to get an item from the cache
const getCache = (key) => {
    return cache[key] || null; // Return cached item or null if not found
};

// Function to set an item in the cache
const setCache = (key, value) => {
    cache[key] = value; // Set the item in cache
};

// Function to clear the cache
const clearCache = (key) => {
    delete cache[key]; // Delete the item from cache
};

// Export cache functions
module.exports = {
    getCache,
    setCache,
    clearCache
};
