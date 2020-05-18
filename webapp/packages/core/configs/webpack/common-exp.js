const merge = require('webpack-merge');
const commonConfig = require('../../../../configs/webpack/common');
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = (env, argv) => merge(commonConfig(env, argv), {
  context: path.resolve(__dirname, '../../src'),
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      tsconfig: path.resolve(__dirname, '../../tsconfig.json'),
      async: false, // slow but run before dev-server starts todo try set true later
    }),

  ],

});
