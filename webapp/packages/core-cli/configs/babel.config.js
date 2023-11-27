/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

module.exports = api => {
  const devMode = !api.env('production');
  api.cache.never();

  return {
    compact: !devMode,
    retainLines: devMode,
    assumptions: {
      setPublicClassFields: true, // defines properties in extending classes via Object.defineProperty
      setSpreadProperties: true,
    },
    presets: [
      [
        '@babel/preset-react',
        {
          development: devMode,
          runtime: 'automatic',
        },
      ],
    ],
    plugins: [[require('@reshadow/babel'), {}], devMode && require.resolve('react-refresh/babel')].filter(Boolean),
  };
};
