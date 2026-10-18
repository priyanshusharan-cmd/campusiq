const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withStripPush(config) {
  return withEntitlementsPlist(config, (config) => {
    // Remove the aps-environment entitlement added by expo-notifications
    // This allows the app to be signed with a free Apple Developer account
    delete config.modResults['aps-environment'];
    return config;
  });
};
