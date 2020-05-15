// production config
const merge = require('webpack-merge');
const {resolve} = require('path');

const commonConfig = require('./common');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    mode: argv.mode || 'development',
    entry: './index.ts',
    output: {
        filename: 'js/bundle.[hash].min.js',
        path: resolve(argv.currentDir, './dist'),
        publicPath: '',
    },
    devtool: 'source-map',
    plugins: [],
    optimization: {
        minimize: true,
        namedModules: false,
        concatenateModules: true,
    },
});
