const merge = require('webpack-merge');
const webpack = require('webpack');
const fs = require('fs');
const { resolve, join } = require('path');
const commonConfig = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var main = resolve('src/index.ts');
var outputDir = resolve('lib');
var package = require(resolve("package.json"))

function getCloudbeaverDeps(package) {
    if (!package.dependencies) {
        return [];
    }

    return Object.keys(package.dependencies)
        .filter(dependency => /@cloudbeaver\/(.*?)/.test(dependency))
}

function scanCloudbeaverDeps() {
    const deps = new Set();
    const list = getCloudbeaverDeps(package);

    while (list.length) {
        const dependency = list.shift();

        if (!deps.has(dependency)) {
            list.push(...getCloudbeaverDeps(require(join(__dirname, '../node_modules', dependency, 'package.json'))))
        }

        deps.add(dependency);
    }

    return Array.from(deps.keys())
}

function getAssets(to) {
    const patterns = scanCloudbeaverDeps()
        .map(dependency => ({ from: join(__dirname, '../node_modules', dependency, 'public'), to, force: true }))
        .reverse();

    patterns.push({ from: './public', to, force: true });

    return patterns.filter(pattern => fs.existsSync(pattern.from))
}

scanCloudbeaverDeps()

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
            patterns: getAssets('')
        }),
        new webpack.DefinePlugin({
            version: JSON.stringify(package.buildVersion),
        }),
        new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), }),
        new webpack.NamedModulesPlugin(),
    ],
});
