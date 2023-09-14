/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/* eslint-disable @typescript-eslint/no-var-requires */

const testingAttributes = require('../lib/babel-plugins/TestingAttributes.js');
const { warn } = console;

// Prevents resolution warnings from babel-plugin-module-resolver
// See https://github.com/tleunen/babel-plugin-module-resolver/issues/315
// eslint-disable-next-line no-console
console.warn = (...args) => {
  for (const arg of args) {
    if (arg.startsWith('Could not resolve') && /src/.test(arg)) {
      return;
    }
  }
  warn(...args);
};

module.exports = api => {
  const devMode = !api.env('production');
  const testMode = api.env('test');

  return {
    compact: !devMode,
    retainLines: devMode,
    assumptions: {
      setPublicClassFields: true, // defines properties in extending classes via Object.defineProperty
      setSpreadProperties: true,
    },
    // env: {
    //   test: {
    //     plugins: ["@babel/plugin-transform-modules-commonjs"]
    //   }
    // },
    presets: [
      [
        '@babel/preset-env',
        {
          modules: testMode ? undefined : false,
          targets: {
            node: 'current',
            browsers: [
              'defaults',
              'not IE 11',
              // "last 1 chrome version",
              // "last 1 firefox version",
              // "last 1 edge version",
              // "last 1 safari version"
            ],
          },
          exclude: ['transform-async-to-generator', 'transform-regenerator'],
        },
      ],
      ['@babel/preset-typescript', { isTSX: true, allExtensions: true, onlyRemoveTypeImports: true }],
      [
        '@babel/preset-react',
        {
          development: devMode,
          runtime: 'automatic',
        },
      ],
    ],
    plugins: [
      'babel-plugin-transform-typescript-metadata',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties'],
      ['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
      [testingAttributes, {}],
      [require('@reshadow/babel'), {}],
      /*devMode &&*/ [
        'babel-plugin-module-resolver',
        {
          alias: {
            '^@cloudbeaver/([^/]*)$': '@cloudbeaver/\\1/src',
            '^@cloudbeaver/([^/]*)/(.*)$': '@cloudbeaver/\\1/\\2',
          },
        },
      ],
      devMode && !testMode && require.resolve('react-refresh/babel'),
    ].filter(Boolean),
  };
};
