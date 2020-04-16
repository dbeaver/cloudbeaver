// production config
const merge = require('webpack-merge');
const {resolve} = require('path');

const commonConfig = require('./common-exp');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    mode: argv.mode || 'development',
    entry: './index.ts',
    output: {
        filename: 'js/bundle.[hash].js',
        path: resolve(__dirname, '../../dist'),
        publicPath: '',
    },
    // devtool: 'source-map',
    plugins: [],
});
