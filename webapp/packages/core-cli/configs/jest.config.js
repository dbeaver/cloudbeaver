// https://jestjs.io/docs/configuration

module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)',
    '/node_modules/(?!(uuid|go-split|@react-dnd|react-dnd-html5-backend|react-dnd|dnd-core|@cloudbeaver))(.*)',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.ts',
    '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.ts',
    '^dexie$': require.resolve('dexie'),
  },
  // collectCoverage: true,
  // collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/types.ts'],
  // coverageReporters: ['json'],
  // restoreMocks: true,
  passWithNoTests: true,
  testEnvironment: 'jsdom',
  setupFiles: ['fake-indexeddb/auto', '../tests/setup.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: { '\\.[jt]sx?$': ['babel-jest', { configFile: require.resolve('./babel.config.js') }] },
};
