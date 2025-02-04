#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

process.title = 'dependency-graph';

import madge from 'madge';

const res = await madge('packages', {
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
});

const writtenImagePath = await res.image('image.svg');
console.log('Image written to ' + writtenImagePath);
