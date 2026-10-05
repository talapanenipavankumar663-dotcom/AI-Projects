const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Stores the Metro file-map cache inside the project (.metro-cache/) instead
 * of the OS temp folder. This prevents "Unable to deserialize cloned data"
 * errors caused by stale or Node-version-incompatible V8 snapshots in %TEMP%.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  cacheStores: [
    new FileStore({
      root: path.join(__dirname, '.metro-cache'),
    }),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
