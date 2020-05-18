// production config
const merge = require('webpack-merge');
const {resolve} = require('path');

const commonConfig = require('./common-exp');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    mode: argv.mode || 'development',
    entry: './index.js',
    output: {
        filename: 'js/bundle.[hash].js',
        path: resolve(argv.currentDir, './dist'),
        publicPath: '',
    },
    devtool: 'source-map',
    plugins: [],
    optimization: {
        minimize: false,
        namedModules: true,
        concatenateModules: false,
    },
});
