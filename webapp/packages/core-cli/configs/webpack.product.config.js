const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const WorkboxPlugin = require('workbox-webpack-plugin');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.config.js');
const { getAssets, withTimestamp } = require('./webpack.product.utils');
const HtmlInjectWebpackPlugin = require('../utils/HtmlInjectWebpackPlugin.js');

const main = resolve('dist/index.js');
const sso = require.resolve('@cloudbeaver/plugin-sso/dist/index.js');
const ssoHtmlTemplate = require.resolve('@cloudbeaver/plugin-sso/src/index.html.ejs');
const outputDir = resolve('lib');
const package = require(resolve('package.json'));
const { getServiceWorkerSource } = require('./webpack.product.utils.js');

const timestampVersion = withTimestamp(package.version);

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';

  var workboxPlugin = [];
  if (devMode) {
    // TODO: workbox not working in dev mode

    // workboxPlugin = new WorkboxPlugin.InjectManifest({
    //   swSrc: getServiceWorkerSource(),
    //   swDest: 'service-worker.js',
    // });
    // Object.defineProperty(workboxPlugin, 'alreadyCalled', {
    //   get() {
    //     return false;
    //   },
    //   set() {},
    // });
  } else {
    workboxPlugin = [new WorkboxPlugin.InjectManifest({
      swSrc: getServiceWorkerSource(),
      swDest: 'service-worker.js',
      maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      exclude: [
        /\.map$/,
        /manifest.*\.js$/,
        /\.tsx?$/,
        /\.tsbuildinfo$/,
      ],
    })];
  }

  return merge(commonConfig(env, argv), {
    entry: {
      main,
      sso,
    },
    devtool: false,
    output: {
      filename: 'index.[contenthash].public-ce.js',
      chunkFilename: '[name].[contenthash].bundle.public-ce.js',
      library: package.name,
      libraryTarget: 'umd',
      path: outputDir,
      pathinfo: false,
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          packages: {
            filename: '[name].[contenthash].public-ce.js',
          },
          locale: {
            filename: '[name].[contenthash].locale.public-ce.js',
          },
        },
      },
      minimize: true,
      minimizer: [new TerserPlugin({
        extractComments: /Copyright \(C\)/i,
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
          mangle: {
            toplevel: true,
            properties: {
              regex: /.*.public-ce..*$/,
            },
          },
        },
        include: [/.*.public-ce..*$/, /^service-worker.js$/],
      })],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: getAssets(package, ''),
      }),
      new webpack.DefinePlugin({
        _VERSION_: JSON.stringify(timestampVersion),
        _DEV_: false,
      }),
      new HtmlWebpackPlugin({
        template: resolve('src/index.html.ejs'),
        inject: 'body',
        chunks: ['main'],
        version: timestampVersion,
        title: package.product?.name,
      }),
      new HtmlWebpackPlugin({
        filename: 'sso.html',
        template: ssoHtmlTemplate,
        inject: 'body',
        chunks: ['sso'],
        version: timestampVersion,
        title: package.product?.name,
      }),
      new HtmlInjectWebpackPlugin({
        body: [{ attributes: { hidden: true }, tagName: 'object', innerHTML: '{STATIC_CONTENT}', voidTag: false }],
      }),
      ...workboxPlugin,
    ],
  });
};
