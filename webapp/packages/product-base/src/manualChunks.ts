/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
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
          rolldownOptions: {
            ...config.build?.rolldownOptions,
            output: {
              ...config.build?.rolldownOptions?.output,
              codeSplitting: {
                groups: [
                  // Locale chunks - highest priority for special handling
                  {
                    name: moduleId => {
                      const normalizedId = moduleId.replace(/\\/g, '/');
                      const langMatch = /[\\/]locales[\\/](\w+)\.js/.exec(normalizedId);
                      if (langMatch) {
                        return `locales/${langMatch[1]}`;
                      }
                      return null;
                    },
                    test: /[\\/]locales[\\/]\w+\.js$/,
                    priority: 60,
                  },
                  // Vendor packages - foundation layer (imported by everything)
                  {
                    name: 'vendor',
                    test: /node_modules/,
                    priority: 50,
                  },
                  // DBeaver packages - shared utilities (common react - data grid, dnd, hotkeys, ui-kit, etc.)
                  {
                    name: 'dbeaver',
                    test: /@dbeaver\//,
                    priority: 40,
                  },
                  // Core packages - application foundation (depends on vendor)
                  {
                    name: 'core',
                    test: /packages\/core-/,
                    priority: 30,
                  },
                  // Plugin packages - features (depend on core)
                  {
                    name: 'plugins',
                    test: /packages\/plugin-/,
                    priority: 20,
                  },
                  // Product packages - top level (depend on everything)
                  {
                    name: 'products',
                    test: /packages\/product-/,
                    priority: 10,
                  },
                ],
              },
            },
          },
        },
      };
    },
  },
];
