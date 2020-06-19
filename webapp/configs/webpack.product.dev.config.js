const merge = require('webpack-merge');
const webpack = require('webpack');
const { resolve, join } = require('path');
const fs = require('fs');
const commonConfig = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var packageJson = require(resolve("package.json"))
var partsNameRegexp = /^@cloudbeaver\/.+$/

var deps = Object.keys(packageJson.dependencies)
    .filter(dep => partsNameRegexp.test(dep))
    .map(dep => {
        const from = `./node_modules/${dep}/lib`
        if (!fs.existsSync(from)) {
            return false;
        }

        return { from, to: `./${dep}`, force: true }
    })

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
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: './public', to: '', force: true },
            ].filter(Boolean)
        }),
        new webpack.DefinePlugin({
            dbeaverPlugins: JSON.stringify(packageJson.dbeaverPlugins),
            version: JSON.stringify(packageJson.buildVersion),
        }),
        new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), }),
        // new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        new webpack.NamedModulesPlugin(),
    ],
});
