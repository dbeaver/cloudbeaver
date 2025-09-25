/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { assetResolverPlugin } from '@wroud/vite-plugin-asset-resolver';
import { tscPlugin } from '@wroud/vite-plugin-tsc';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  server: {
    fs: {
      strict: false,
    },
  },
  plugins: [
    svgr(),
    tailwindcss(),
    assetResolverPlugin(),
    tscPlugin({
      tscArgs: ['-b'],
      enableOverlay: true,
      prebuild: true,
    }),
  ],
});
