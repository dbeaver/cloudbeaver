// production config
const merge = require('webpack-merge');
const path = require('path');

const commonConfig = require('./webpack-common-config');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
  mode: argv.mode,
  entry: './index.js',
  output: {
    filename: 'js/bundle.[hash].js',
    path: path.resolve(argv.currentDir, './dist'),
    publicPath: '',
  },
  devtool: argv.mode === 'production' ? false : 'source-map',
  plugins: [],
  optimization: {
    minimize: argv.mode === 'production',
    namedModules: argv.mode !== 'production',
    concatenateModules: argv.mode === 'production',
  },
});
