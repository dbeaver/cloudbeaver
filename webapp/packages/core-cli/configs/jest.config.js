// https://jestjs.io/docs/configuration
const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: require.resolve('../tests/test.environment.js'),
  rootDir: path.resolve('./dist'),
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: ['**/?(*.)+(spec|test).js?(x)'],
  transformIgnorePatterns: [
    '\\.pnp\\.[^\\/]+$',
    'node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)',
    '/node_modules/(?!(uuid|go-split|@react-dnd|react-dnd-html5-backend|react-dnd|dnd-core|@cloudbeaver))(.*)',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': require.resolve('./__mocks__/fileMock.js'),
    '\\.(css|scss|less)$': require.resolve('./__mocks__/styleMock.js'),
    '^dexie$': require.resolve('dexie'),

    '^reshadow$': 'reshadow/lib',
    '^@reshadow/react$': '@reshadow/react/lib',
    '^@reshadow/runtime$': '@reshadow/runtime/lib',
  },
  passWithNoTests: true,
  setupFiles: [require.resolve('fake-indexeddb/auto'), require.resolve('../tests/setup.js')],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: {
    '\\.jsx?$': ['babel-jest', { configFile: require.resolve('./jest.babel.config.js') }],
  },
  testEnvironmentOptions: {
    // This will force JSDOM to use the default export condition when importing msw/node, resulting in correct imports.
    // https://mswjs.io/docs/migrations/1.x-to-2.x#cannot-find-module-mswnode-jsdom
    customExportConditions: [''],
  },
};
