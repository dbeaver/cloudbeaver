const { merge } = require('webpack-merge');
const webpack = require('webpack');
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const commonConfig = require('./webpack.config.js');
const getAssets = require('./webpack.product.utils');

var main = resolve('src/index.ts');
var outputDir = resolve('lib');
var package = require(resolve("package.json"))

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    entry: main,
    output: {
        filename: 'index.js',
        chunkFilename: '[name].bundle.js',
        library: package.name,
        libraryTarget: 'umd',
        path: outputDir,
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
        usedExports: true,
        sideEffects: true,
        minimize: true,
        namedModules: true,
        concatenateModules: true,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: getAssets(package, '')
        }),
        new webpack.DefinePlugin({
            version: JSON.stringify(package.buildVersion),
        }),
        new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), }),
    ],
});
