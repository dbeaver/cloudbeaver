/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const { resolve } = require('path');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { SourceAssetsResolver } = require('../utils/SourceAssetsResolver.js');
const { IgnoreNotFoundExportPlugin } = require('../utils/IgnoreNotFoundExportPlugin.js');
const excludedFromVendor = require('./excludedFromVendor.js');
const webpack = require('webpack');

const nodeModules = [
  resolve('node_modules'), // product
  resolve('../../node_modules'), // workspace
  resolve('../../node_modules/@cloudbeaver/core-cli/node_modules'), // core-cli
];

module.exports = (env, argv) => {
  process.env.NODE_ENV = argv.mode;
  const devMode = argv.mode !== 'production';
  function getBaseStyleLoaders() {
    const loaders = [];

    // Broke styles order in dev mode
    // if (devMode) {
    //   loaders.push('style-loader');
    // } else {
    loaders.push(MiniCssExtractPlugin.loader);
    // }

    return loaders;
  }

  function generateStyleLoaders(options = { hasModule: false, disable: false, pure: false }) {
    const moduleScope = options.hasModule ? 'local' : 'global';
    let modules = {
      mode: moduleScope,
      localIdentName: '[local]___[hash:base64:5]',
    };

    if (options.disable) {
      modules = false;
    }

    const postCssPlugins = [require('postcss-preset-env')({ stage: 0 })];

    return [
      ...getBaseStyleLoaders(),
      {
        loader: 'css-loader',
        options: {
          esModule: true,
          modules: modules,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: postCssPlugins,
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sassOptions: {
            implementation: require('sass'),
            includePaths: nodeModules,
            quietDeps: true,
          },
        },
      },
    ];
  }

  var babelLoader = {
    loader: require.resolve('babel-loader'),
    options: {
      root: __dirname,
      // cacheDirectory: true,
      envName: argv.mode,
    },
  };

  return {
    optimization: {
      runtimeChunk: 'single',
      moduleIds: 'deterministic',
      usedExports: true,
      sideEffects: true,
      concatenateModules: true,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          locale: {
            test: /[\\/]locales[\\/].*?\.js/,
            filename: '[name].[contenthash].js',
            name(module) {
              return module.rawRequest.substr(2);
            },
            priority: -5,
            reuseExistingChunk: true,
          },
          packages: {
            test: /[\\/]packages[\\/]((plugin|core)-.*?)[\\/](src|dist)[\\/]/,
            filename: '[name].[contenthash].js',
            name(module) {
              const path = module.context ?? module.resource;
              const match = /[\\/]packages[\\/]((plugin|core)-.*?)([\\/]|$)/.exec(path);
              if (!path || !match) {
                return 'package';
              }
              return match[1];
            },
            priority: -10,
            enforce: true,
          },
          defaultVendors: {
            chunks: 'all',
            name: 'vendors',
            test: new RegExp(`[\\\\/]node_modules[\\\\/](?!${excludedFromVendor.join('|')}).*?[\\\\/]`, ''),
            priority: -20,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -40,
            reuseExistingChunk: true,
          },
          // styles: {
          //   name: 'styles',
          //   type: 'css/mini-extract',
          //   chunks: 'all',
          //   enforce: true,
          // },
        },
      },
    },
    output: {
      pathinfo: false,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.wasm', '.mjs', '.js', '.jsx', '.json', '.json5'],
      modules: nodeModules,
      plugins: [PnpWebpackPlugin, new SourceAssetsResolver(['.json5', '.css', '.scss', '.json'])],
    },
    resolveLoader: {
      modules: nodeModules,
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
    },
    module: {
      rules: [
        {
          test: /\.json5$/i,
          loader: 'json5-loader',
          type: 'javascript/auto',
        },
        devMode && {
          test: /\.jsx?$/,
          enforce: 'pre',
          exclude: /node_modules/,
          use: ['source-map-loader'],
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: ['thread-loader', babelLoader],
        },
        {
          test: /\.(css|s[ac]ss)$/,
          exclude: /node_modules/,
          oneOf: [
            {
              test: /\.module\.(css|s[ac]ss)$/,
              use: generateStyleLoaders({ hasModule: true }),
            },
            {
              test: /\.m\.(css|s[ac]ss)$/,
              use: generateStyleLoaders({ hasModule: true, pure: true }),
            },
            {
              include: /node_modules/,
              use: [...getBaseStyleLoaders(), 'css-loader', 'sass-loader'],
            },
            {
              test: /\.(theme|pure)\.(css|s[ac]ss)$/,
              use: generateStyleLoaders({ disable: true }),
            },
            {
              use: generateStyleLoaders(),
            },
          ],
        },
        {
          test: /\.(png|jpg|gif)$/i,
          type: 'asset/inline',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    ignoreWarnings: [/Failed to parse source map/],
    devtool: devMode ? 'source-map' : false,
    plugins: [
      new webpack.WatchIgnorePlugin({
        paths: [/.tsbuildinfo$/],
      }),
      new IgnoreNotFoundExportPlugin(),
      new MiniCssExtractPlugin({
        filename: devMode ? 'styles/[name].css' : 'styles/[name].[contenthash].css',
        chunkFilename: devMode ? 'styles/[name].bundle.css' : 'styles/[name].[contenthash].css',
        ignoreOrder: true, // Enable to remove warnings about conflicting order
        insert: linkTag => {
          document.head.appendChild(linkTag);
        },
      }),
    ],
  };
};
