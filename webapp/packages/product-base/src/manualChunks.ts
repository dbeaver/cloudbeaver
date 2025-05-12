/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type PluginOption } from 'vite';

export const manualChunks = (): PluginOption => [
  {
    name: 'manual-chunks',
    enforce: 'pre',
    config(config) {
      return {
        ...config,
        build: {
          ...config.build,
          rollupOptions: {
            ...config.build?.rollupOptions,
            output: {
              ...config.build?.rollupOptions?.output,
              manualChunks(id) {
                const langMatch = /[\\/]locales[\\/](\w+)\.js/.exec(id);
                if (langMatch) {
                  const language = langMatch[1]; // e.g. "en"
                  return `locales/${language}`;
                }

                if (id.includes('packages/core-')) {
                  return 'core';
                }

                if (id.includes('packages/plugin-')) {
                  return 'plugins';
                }

                if (id.includes('packages/product-')) {
                  return 'products';
                }

                if (id.includes('@dbeaver/')) {
                  return 'dbeaver';
                }

                if (id.includes('node_modules')) {
                  return 'vendor';
                }

                return null;
              },
            },
          },
        },
      };
    },
  },
];
