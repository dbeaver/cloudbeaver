const merge = require('webpack-merge');
const webpack = require('webpack');
const { resolve } = require('path');
const commonConfig = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var packageJson = require(resolve("package.json"))

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
            ]
        }),
        new webpack.DefinePlugin({
            version: JSON.stringify(packageJson.buildVersion),
        }),
        new HtmlWebpackPlugin({ template: resolve('src/index.html.ejs'), }),
        new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        new webpack.NamedModulesPlugin(),
        // new BundleAnalyzerPlugin()
    ],
});
