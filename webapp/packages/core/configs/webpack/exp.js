// production config
const merge = require('webpack-merge');
const {resolve} = require('path');
var PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

const commonConfig = require('./common-exp');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    mode: argv.mode || 'development',
    entry: {
        app: "./app/index.ts",
        blocks: "./blocks/index.ts",
        di: "./di/index.ts",
        dialogs: "./dialogs/index.ts",
        eventsLog: "./eventsLog/index.ts",
        localization: "./localization/index.ts",
        // queries dir - ignore
        root: "./root/index.ts",
        sdk: "./sdk/index.ts",
        settings: "./settings/index.ts",
        theming: "./theming/index.ts",
        utils: "./utils/index.ts",
        main: "./index.ts",
    },
    output: {
        filename: (chunkData) => {
            console.log('chunkData.chunk.name', chunkData.chunk.name);
            return chunkData.chunk.name === 'main' ? 'index.js': '[name]/index.js';
        },
        // filename: 'index.js',
        path: resolve(__dirname, '../../dist'),
        library: ["@dbeaver/core", "[name]"],
        libraryTarget: 'umd',
        libraryExport: 'default',
        umdNamedDefine: true,
    },
    // devtool: 'source-map',
    externals: [
        /^@dbeaver\/.+$/
    ],
    plugins: [
        new PeerDepsExternalsPlugin(), // allow to treat all peerDependencies as externals
    ],
});
