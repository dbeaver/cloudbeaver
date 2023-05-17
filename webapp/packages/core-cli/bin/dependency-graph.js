#!/usr/bin/env node

'use strict';
process.title = 'dependency-graph';

const madge = require('madge');
const { resolve } = require('path');

madge('packages', {
  includeNpm: true,
  fileExtensions: ['ts', 'tsx'],
  detectiveOptions: {
    // noTypeDefinitions: true,
    es6: {
      mixedImports: true,
      // skipTypeImports: true,
    },
    ts: {
      mixedImports: true,
      // skipTypeImports: true,
    },
  },
})
  .then(res => res.image('image.svg'))
  .then(writtenImagePath => {
    console.log('Image written to ' + writtenImagePath);
  });