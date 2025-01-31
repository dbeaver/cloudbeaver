/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginOption } from 'vite';

// eslint-disable-next-line arrow-body-style
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
                manualChunks(id) {
                  const langMatch = /[\\/]locales[\\/](\w+)\.js/.exec(id);
                  if (langMatch) {
                    const language = langMatch[1]; // e.g. "en"
                    return `locales/${language}`;
                  }

                  const packageMatch = /[\\/]packages[\\/]((plugin|core)-.*?)[\\/](src|dist)[\\/]/.exec(id);
                  if (packageMatch) {
                    return packageMatch[1];
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
