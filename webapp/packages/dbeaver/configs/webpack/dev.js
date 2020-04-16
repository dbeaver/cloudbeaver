// development config
const merge = require('webpack-merge');
const webpack = require('webpack');
const commonConfig = require('./common');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    mode: argv.mode || 'development',
    entry: [
        // 'react-hot-loader/patch', // activate HMR for React
        'webpack-dev-server/client?http://localhost:3100',// bundle the client for webpack-dev-server and connect to the provided endpoint
        // 'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
        './index.ts' // the entry point of our app
    ],
    devServer: {
        hot: true, // enable HMR on the server
        proxy: {
            '/dbeaver': {
                target: argv.server || 'localhost:3100'
            }
        }
    },
    devtool: 'cheap-module-eval-source-map',
    plugins: [
        // new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        new webpack.NamedModulesPlugin(), // prints more readable module names in the browser console on HMR updates
    ],
});
