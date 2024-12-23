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
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -b",
    "clean": "rimraf --glob dist",
    "lint": "eslint ./src/ --ext .ts,.tsx",
    "test": "core-cli-test",
    "validate-dependencies": "core-cli-validate-dependencies",
    "update-ts-references": "yarn run clean && typescript-resolve-references"
  },
  "dependencies": {
    "@cloudbeaver/core-di": "^0"
  },
  "peerDependencies": {},
  "devDependencies": {
    "typescript": "^5"
  }
}