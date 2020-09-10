const { merge } = require('webpack-merge');
const webpack = require('webpack');
const { resolve } = require('path');
const commonConfig = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const getAssets = require('./webpack.product.utils');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var package = require(resolve("package.json"))

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    entry: [
        'webpack-dev-server/client?http://localhost:3100',
        './src/index.ts'
    ],
    devServer: {
        hot: true,
        proxy: {
            '/dbeaver': {
                target: argv.server
            }
        }
    },
    devtool: 'cheap-module-eval-source-map',
    optimization: {
        namedModules: true,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: getAssets(package, '')
        }),
        new webpack.DefinePlugin({
            version: JSON.stringify(package.buildVersion),
        }),
        new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), }),
        new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        // new BundleAnalyzerPlugin()
    ],
});
