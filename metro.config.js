const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("cjs");

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "pdf-lib": require.resolve("pdf-lib/dist/pdf-lib.min.js"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
