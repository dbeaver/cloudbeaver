const merge = require('webpack-merge');
const {resolve} = require('path');
var PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

const commonConfig = require('./common');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    mode: argv.mode || 'development',
    entry: resolve(__dirname, '../../src/index.ts'), // todo
    output: {
        filename: 'index.js',
        path: resolve(__dirname, '../../dist'),
        library: 'basicConnectionPlugin', // todo pass from package.js
        libraryTarget: 'umd',
    },
    externals: [
        /^@dbeaver\/.+$/
    ],
    devtool: 'source-map',
    plugins: [
        new PeerDepsExternalsPlugin(), // allow to treat all peerDependencies as externals
    ],
});
