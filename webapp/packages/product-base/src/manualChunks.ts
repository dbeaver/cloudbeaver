/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type PluginOption } from 'vite';

const vendorChunks = new Map([
  ['d3-', 'vendor/d3'],
  ['lodash', 'vendor/lodash'],
  ['codemirror', 'vendor/codemirror'],
]);

export const manualChunks = (): PluginOption => {
  return [
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
                  if (id.includes('node_modules')) {
                    for (const [pattern, chunk] of vendorChunks.entries()) {
                      if (id.includes(pattern)) {
                        return chunk;
                      }
                    }

                    return 'vendor/others';
                  }

                  if (id.includes('common-')) {
                    return 'common';
                  }

                  if (id.includes('plugin-')) {
                    return 'plugins';
                  }

                  if (id.includes('LocaleService')) {
                    return 'locale';
                  }

                  const langMatch = /[\\/]locales[\\/](\w+)\.js/.exec(id);
                  if (langMatch) {
                    const language = langMatch[1]; // e.g. "en"
                    return `locales/${language}`;
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
};
