/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const { merge } = require('webpack-merge');
const { resolve } = require('path');
const webpack = require('webpack');
const httpProxy = require('http-proxy');
const { EsbuildPlugin } = require('esbuild-loader');
const fs = require('fs');

const commonConfig = require('./webpack.config.js');
const ssoHtmlTemplate = require.resolve('@cloudbeaver/plugin-sso/src/index.html.ejs');
const ssoErrorHtmlTemplate = require.resolve('@cloudbeaver/plugin-sso/src/ssoError.html.ejs');
const { getAssets } = require('./webpack.product.utils');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlInjectWebpackPlugin = require('../utils/HtmlInjectWebpackPlugin');


const package = require(resolve('package.json'));

const certPath = resolve(__dirname, '../../../../../certs/private.pem');
const keyPath = resolve(__dirname, '../../../../../certs/private.key');
let server = undefined;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  server = {
    type: 'https',
    options: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  };
}

module.exports = (env, argv) => {
  const envServer = env.server ?? process.env.server;

  return merge(commonConfig(env, argv), {
    mode: 'development',
    output: {
      devtoolModuleFilenameTemplate: 'file:///[absolute-resource-path]',
    },
    watchOptions: {
      aggregateTimeout: 1000,
      ignored: ['**/node_modules', '**/packages/*/src/**/*.{ts,tsx}'],
    },
    optimization: {
      minimize: false,
      runtimeChunk: 'single',
      moduleIds: 'named',
    },
    infrastructureLogging: {
      level: 'warn',
    },
    devServer: {
      allowedHosts: 'all',
      host: 'localhost',
      port: 8080,
      client: {
        webSocketURL: 'auto://localhost:0/ws',
        overlay: false,
      },
      server,
      proxy: [
        {
          context: ['/api', '/api/ws'],
          target: envServer,
          secure: false,
          ws: true,
        },
      ],
      // onListening: function (devServer, ...args) {
      //   if (!devServer) {
      //     throw new Error('webpack-dev-server is not defined');
      //   }
      //   const logger = devServer.compiler.getInfrastructureLogger('webpack-dev-server');
      //   const port = devServer.server.address().port;
      //   logger.info(`Proxy from http://localhost:8080 to http://127.0.0.1:${port}`);
      //   httpProxy.createProxyServer({ target:`http://127.0.0.1:${port}`, secure: false }).listen(8080);
      // },
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: getAssets(package, ''),
      }),
      new webpack.DefinePlugin({
        _VERSION_: JSON.stringify(package.version),
        _DEV_: true,
      }),

      // for some reason it doesn't work with source maps
      // new EsbuildPlugin({
      //     define: {
      //       _VERSION_: JSON.stringify(package.version),
      //       _DEV_: JSON.stringify(true),
      //     },
      // }),
      new HtmlWebpackPlugin({
        template: resolve('src/index.html.ejs'),
        inject: 'body',
        chunks: ['main'],
        version: package.version,
        title: package.product?.name,
      }),
      new HtmlWebpackPlugin({
        filename: 'sso.html',
        template: ssoHtmlTemplate,
        inject: 'body',
        chunks: ['sso'],
        version: package.version,
        title: package.product?.name,
      }),
      new HtmlWebpackPlugin({
        filename: 'ssoError.html',
        template: ssoErrorHtmlTemplate,
        inject: 'body',
        chunks: ['sso'],
        version: package.version,
        title: package.product?.name,
      }),
      new HtmlInjectWebpackPlugin({
        body: [{ attributes: { hidden: true }, tagName: 'object', innerHTML: '{STATIC_CONTENT}', voidTag: false }],
      }),
      new HtmlReplaceWebpackPlugin([
        {
          pattern: '{ROOT_URI}',
          replacement: '/',
        },
      ]),
      new webpack.HotModuleReplacementPlugin(),
      new ReactRefreshWebpackPlugin({ overlay: false }),
    ],
  });
};
