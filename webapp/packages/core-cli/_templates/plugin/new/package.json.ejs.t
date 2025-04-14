---
to: <%= name %>/package.json
---
{
  "name": "@cloudbeaver/<%= name %>",
  "type": "module",
  "sideEffects": [
    "src/**/*.css",
    "src/**/*.scss",
    "public/**/*"
  ],
  "version": "0.1.0",
  "description": "",
  "license": "Apache-2.0",
  "exports": {
    ".": "./lib/index.js"
  },
  "scripts": {
    "build": "tsc -b",
    "clean": "rimraf --glob lib",
    "lint": "eslint ./src/ --ext .ts,.tsx",
    "test": "core-cli-test",
    "validate-dependencies": "core-cli-validate-dependencies"
  },
  "dependencies": {
    "@cloudbeaver/core-di": "^0"
  },
  "peerDependencies": {},
  "devDependencies": {
    "rimraf": "^6",
    "@cloudbeaver/core-cli": "^0",
    "typescript": "^5"
  }
}