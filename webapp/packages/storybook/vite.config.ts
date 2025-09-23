/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tscPlugin } from '@wroud/vite-plugin-tsc';
import { assetResolverPlugin } from '@wroud/vite-plugin-asset-resolver';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tscPlugin({
      tscArgs: ['-b'],
      prebuild: true,
      enableOverlay: true,
    }),
    assetResolverPlugin(),
    tailwindcss(),
  ],
});
