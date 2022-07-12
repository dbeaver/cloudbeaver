// https://jestjs.io/docs/configuration

module.exports = {
  transformIgnorePatterns: [
    "node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)"
  ],
  // collectCoverage: true,
  // collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/types.ts'],
  // coverageReporters: ['json'],
  // restoreMocks: true,
  passWithNoTests: true,
  testEnvironment: 'jsdom',
  setupFiles: ['../tests/setup.ts'],
  transform: {"\\.[jt]sx?$": ['babel-jest', { configFile: require.resolve('./babel.config.js') }]}
};
