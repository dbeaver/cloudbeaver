/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const { resolve, join } = require('path');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { SourceAssetsResolver } = require('../utils/SourceAssetsResolver.js');
const { IgnoreNotFoundExportPlugin } = require('../utils/IgnoreNotFoundExportPlugin.js');
const excludedFromVendor = require('./excludedFromVendor.js');
const WorkboxPlugin = require('workbox-webpack-plugin');
const webpack = require('webpack');
const { getServiceWorkerSource } = require('./webpack.product.utils.js');

const main = resolve('dist/index.js');
const sso = require.resolve('@cloudbeaver/plugin-sso/dist/index.js');

const nodeModules = [
  resolve('node_modules'), // product
  resolve('../../node_modules'), // workspace
  resolve('../../node_modules/@cloudbeaver/core-cli/node_modules'), // core-cli
];

module.exports = (env, argv) => {
  process.env.NODE_ENV = argv.mode;
  const devMode = argv.mode !== 'production';

  const workboxPlugin = [];

  if (devMode) {
    workboxPlugin.push(
      new WorkboxPlugin.InjectManifest({
        swSrc: getServiceWorkerSource(),
        swDest: 'service-worker.js',
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        exclude: [/license\.txt$/, /\.map$/, /manifest.*\.js$/, /\.tsx?$/, /\.tsbuildinfo$/, /\.DS_Store$/],
      }),
    );

    if (devMode) {
      // Suppress the "InjectManifest has been called multiple times" warning by reaching into
      // the private properties of the plugin and making sure it never ends up in the state
      // where it makes that warning.
      // https://github.com/GoogleChrome/workbox/blob/v6/packages/workbox-webpack-plugin/src/inject-manifest.ts#L260-L282
      Object.defineProperty(workboxPlugin, 'alreadyCalled', {
        get() {
          return false;
        },
        set() {
          // do nothing; the internals try to set it to true, which then results in a warning
          // on the next run of webpack.
        },
      });
    }
  }
  function getBaseStyleLoaders() {
    const loaders = [];

    // Broke styles order in dev mode
    if (devMode) {
      loaders.push('style-loader');
    } else {
      loaders.push(MiniCssExtractPlugin.loader);
    }

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
    context: resolve(__dirname, '../../../../../'),
    experiments: {
      layers: true,
    },
    entry: {
      main: {
        import: main,
        runtime: 'main-runtime',
        layer: 'main',
      },
      sso: {
        import: sso,
        runtime: 'sso-runtime',
        layer: 'sso',
      },
    },
    output: {
      filename: 'js/[name]-[contenthash].js',
      chunkFilename: 'js/[name]-[contenthash].js',
      pathinfo: false,
    },
    optimization: {
      runtimeChunk: 'multiple',
      moduleIds: 'deterministic',
      usedExports: true,
      sideEffects: true,
      concatenateModules: true,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: {
        cacheGroups: {
          locale: {
            chunks: 'all',
            test: /[\\/]locales[\\/].*?\.js/,
            name(module) {
              return module.rawRequest.substr(2);
            },
            priority: 20,
            reuseExistingChunk: true,
            enforce: true,
            layer: 'main',
          },
          packages: {
            chunks: 'initial',
            test: /[\\/]packages[\\/]((plugin|core)-.*?)[\\/](src|dist)[\\/]/,
            name: 'packages',
            priority: 10,
            reuseExistingChunk: true,
            layer: 'main',
          },
          packagesAsync: {
            chunks: 'async',
            test: /[\\/]packages[\\/]((plugin|core)-.*?)[\\/](src|dist)[\\/]/,
            name(module) {
              const path = module.context ?? module.resource;
              const match = /[\\/]packages[\\/]((plugin|core)-.*?)([\\/]|$)/.exec(path);
              if (!path || !match) {
                return 'package';
              }
              return match[1];
            },
            priority: 10,
            reuseExistingChunk: true,
            layer: 'main',
          },
          extendedVendorAsync: {
            chunks: 'async',
            test: new RegExp(`[\\/]node_modules/(${excludedFromVendor.join('|')}).*?`, ''),
            name: 'extended-vendor-async',
            priority: -5,
            reuseExistingChunk: true,
            layer: 'main',
          },
          extendedVendor: {
            chunks: 'initial',
            name: 'extended-vendor',
            test: new RegExp(`[\\/]node_modules/(${excludedFromVendor.join('|')}).*?`, ''),
            priority: -5,
            reuseExistingChunk: true,
            layer: 'main',
          },
          vendorAsync: {
            chunks: 'async',
            test: new RegExp(`[\\/]node_modules/(?!:${excludedFromVendor.join('|')}).*?`, ''),
            name: 'vendor-async',
            priority: -10,
            reuseExistingChunk: true,
            layer: 'main',
          },
          vendor: {
            chunks: 'initial',
            name: 'vendor',
            test: new RegExp(`[\\/]node_modules/(?!:${excludedFromVendor.join('|')}).*?`, ''),
            priority: -10,
            reuseExistingChunk: true,
            layer: 'main',
          },
          asyncCommons: {
            chunks: 'async',
            name: 'commons-async',
            filename: 'js/[name]-[contenthash].js',
            priority: -15,
            layer: 'main',
          },
          commons: {
            chunks: 'initial',
            name: 'commons',
            filename: 'js/[name]-[contenthash].js',
            priority: -15,
            layer: 'main',
          },
          defaultAsync: {
            chunks: 'async',
            name: 'bundle-async',
            filename: '[name]-[contenthash].js',
            priority: -20,
            reuseExistingChunk: true,
            layer: 'main',
          },
          default: {
            chunks: 'initial',
            name: 'bundle',
            filename: '[name]-[contenthash].js',
            priority: -20,
            reuseExistingChunk: true,
            layer: 'main',
          },
          defaultAsyncSso: {
            chunks: 'async',
            name: 'bundle-async',
            filename: '[name]-[contenthash].js',
            priority: -20,
            reuseExistingChunk: true,
            layer: 'sso',
          },
          defaultSso: {
            chunks: 'initial',
            name: 'bundle',
            filename: '[name]-[contenthash].js',
            priority: -20,
            reuseExistingChunk: true,
            layer: 'sso',
          },
        },
      },
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
          generator: {
            filename: 'fonts/[hash][ext][query]',
          },
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
        filename: devMode ? 'styles/[name].css' : 'styles/[name]-[contenthash].css',
        chunkFilename: devMode ? 'styles/[name].bundle.css' : 'styles/[name]-[contenthash].css',
        ignoreOrder: true, // Enable to remove warnings about conflicting order
        insert: linkTag => {
          document.head.appendChild(linkTag);
        },
      }),
      ...workboxPlugin,
    ],
  };
};
