const { resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.js');

const index = resolve('src/index.ts');
const outputDir = resolve('lib');
const package = require(resolve('package.json'));

module.exports = (env, argv) => merge(commonConfig(env, argv), {
  entry: {
    // [package.name.replace('@cloudbeaver/', '')]: index,
    
    index,
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].[contenthash].bundle.js',
    library: package.name,
    libraryTarget: 'commonjs',
    path: outputDir,
  },
  externals: /^@cloudbeaver\/.+$/i,
  plugins: [
    new PeerDepsExternalsPlugin(),
  ],
});
