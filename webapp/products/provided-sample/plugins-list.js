/**
 * Don't mention "@dbeaver/core" here. It will be included by default
 */

const plugins = require('../default/plugins-list');
const ignoredPlugins = ['@dbeaver/basic-connection-plugin', '@dbeaver/custom-connection-plugin'];

const pluginsWithoutConnections = plugins.filter(plugin => !ignoredPlugins.includes(plugin))


module.exports = pluginsWithoutConnections;
