/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// https://jestjs.io/docs/configuration
const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: require.resolve('../tests/test.environment.js'),
  rootDir: path.resolve('.'),
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: [
    // unix
    '<rootDir>/packages/*/dist/**/?(*.)+(spec|test).js?(x)',
    '<rootDir>/dist/**/?(*.)+(spec|test).js?(x)',
    // windows
    '<rootDir>\\packages\\*\\dist\\**?(*.)+(spec|test).js?(x)',
    '<rootDir>\\dist\\**?(*.)+(spec|test).js?(x)',
  ],
  transformIgnorePatterns: [
    '\\.pnp\\.[^\\/]+$',
    'node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)',
    '/node_modules/(?!(uuid|go-split|@react-dnd|react-dnd-html5-backend|@timohausmann|react-dnd|dnd-core|@cloudbeaver))(.*)',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': require.resolve('./__mocks__/fileMock.js'),
    '\\.(css|scss|less)$': require.resolve('./__mocks__/styleMock.js'),
    // '^dexie$': require.resolve('dexie'),
  },
  // passWithNoTests: true,
  setupFiles: [require.resolve('fake-indexeddb/auto'), require.resolve('../tests/setup.js')],
  setupFilesAfterEnv: ['@testing-library/jest-dom/jest-globals'],
  transform: {
    '\\.jsx?$': [require.resolve('@swc/jest')],
  },
  testEnvironmentOptions: {
    // This will force JSDOM to use the default export condition when importing msw/node, resulting in correct imports.
    // https://mswjs.io/docs/migrations/1.x-to-2.x#cannot-find-module-mswnode-jsdom
    customExportConditions: [''],
  },
  injectGlobals: false,
};
