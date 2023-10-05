// https://jestjs.io/docs/configuration
const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  rootDir: path.resolve('./dist'),
  transformIgnorePatterns: [
    '\\.pnp\\.[^\\/]+$',
    'node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)',
    '/node_modules/(?!(uuid|go-split|@react-dnd|react-dnd-html5-backend|react-dnd|dnd-core|@cloudbeaver))(.*)',
  ],
  // transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$', 'reshadow'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': require.resolve('./__mocks__/fileMock.js'),
    '\\.(css|scss|less)$': require.resolve('./__mocks__/styleMock.js'),
    '^dexie$': require.resolve('dexie'),

    // '^@cloudbeaver/([^/]*)$': '@cloudbeaver/$1/src',
    // '^@cloudbeaver/([^/]*)/(.*)$': '@cloudbeaver/$1/$2',

    '^reshadow$': 'reshadow/lib',
    '^@reshadow/react$': '@reshadow/react/lib',
    '^@reshadow/runtime$': '@reshadow/runtime/lib',
  },
  // collectCoverage: true,
  // collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/types.ts'],
  // coverageReporters: ['json'],
  // restoreMocks: true,
  passWithNoTests: true,
  setupFiles: [require.resolve('fake-indexeddb/auto'), require.resolve('../tests/setup.js')],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: {
    '\\.jsx?$': ['babel-jest', { configFile: require.resolve('./babel.config.js') }],
  },
};
