const merge = require('webpack-merge');
const webpack = require('webpack');
const { resolve, join } = require('path');
const fs = require('fs');
const commonConfig = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var main = resolve('src/index.ts');
var outputDir = resolve('lib');
var package = require(resolve("package.json"))
var partsNameRegexp = /^@cloudbeaver\/.+$/

var deps = Object.keys(package.dependencies)
    .filter(dep => partsNameRegexp.test(dep))
    .map(dep => {
        const from = `./node_modules/${dep}/lib`
        if (!fs.existsSync(from)) {
            return false;
        }

        return { from, to: `./${dep}`, force: true }
    })

module.exports = (env, argv) => merge(commonConfig(env, argv), {
    entry: main,
    output: {
        filename: 'index.js',
        chunkFilename: '[name].bundle.js',
        library: package.name,
        libraryTarget: 'umd',
        path: outputDir,
    },
    devtool: 'cheap-module-eval-source-map',
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
        minimize: true,
        namedModules: true,
        concatenateModules: true,
    },
    plugins: [
        // new CopyWebpackPlugin({
        //     patterns: [
        //         { from: './public', to: '', force: true },
        //         ...deps
        //     ].filter(Boolean)
        // }),
        new webpack.DefinePlugin({
            version: JSON.stringify(package.buildVersion),
        }),
        new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), }),
        // new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        new webpack.NamedModulesPlugin(),
    ],
});
