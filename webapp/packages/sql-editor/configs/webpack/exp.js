// production config
const merge = require('webpack-merge');
const {resolve} = require('path');
var PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

const commonConfig = require('../../../../configs/webpack/common');

module.exports = merge(commonConfig, {
    mode: 'development',
    entry: resolve(__dirname, '../../src/index.ts'),
    output: {
        filename: 'index.js',
        path: resolve(__dirname, '../../dist'),
        library: 'sqlEditorPlugin',
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
