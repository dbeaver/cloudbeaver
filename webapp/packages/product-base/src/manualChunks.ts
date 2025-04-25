/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type PluginOption } from 'vite';

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
                ...config.build?.rollupOptions?.output,
                manualChunks(id, { getModuleInfo }) {
                  function isModuleSync(moduleId: string) {
                    const info = getModuleInfo(moduleId);
                    if (!info) {
                      return true;
                    } // fallback if no info available
                    if (info.isEntry) {
                      return true;
                    }
                    // info.importers is the list of modules that import this module.
                    // info.dynamicImporters is the subset of those that import it dynamically.
                    // If there’s any importer that did a static import, we consider this module sync.
                    return info.importers && info.importers.some(importer => !info.dynamicImporters.includes(importer));
                  }

                  const nodeModulesMatch = /[\\/]node_modules[\\/](.*?)[\\/]/.exec(id);

                  if (nodeModulesMatch) {
                    if (isModuleSync(id)) {
                      return 'vendor';
                    }

                    return 'vendor-async';
                  }

                  const langMatch = /[\\/]locales[\\/](\w+)\.js/.exec(id);
                  if (langMatch) {
                    const language = langMatch[1]; // e.g. "en"
                    return `locales/${language}`;
                  }

                  const packageMatch = /[\\/]packages[\\/]((plugin|core)-.*?)[\\/](src|dist|lib)[\\/]/.exec(id);
                  if (packageMatch) {
                    const packageName = packageMatch[1]; // e.g. "plugin-data-export"

                    const moduleInfo = getModuleInfo(id);
                    if (!moduleInfo) {
                      return null;
                    }

                    // Ensure we correctly group synchronous and dynamic imports
                    const isDynamic = moduleInfo.dynamicImporters.length > 0;
                    const isEntry = moduleInfo.isEntry;

                    // If it's an entry point or dynamically imported, create a unique chunk
                    if (isEntry || isDynamic) {
                      return `shared.${packageName}`;
                    }

                    // Ensure that statically imported modules remain in the same chunk
                    if (moduleInfo.importers.length > 0) {
                      // Find the top-most importer that is an entry point
                      const topLevelEntry = moduleInfo.importers.find(importer => getModuleInfo(importer)?.isEntry);
                      if (topLevelEntry) {
                        return `entry.${packageName}`;
                      }
                    }

                    // Default to a shared chunk for the package
                    return `shared.${packageName}`;
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
