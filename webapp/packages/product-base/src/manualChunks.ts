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
              manualChunks(id, { getModuleInfo }) {
                function isModuleSync(moduleId: string) {
                  // Use a non-recursive approach to detect circular dependencies
                  const visited = new Set<string>();
                  const queue = [moduleId];
                  
                  // Track which modules we've already determined to be sync
                  const syncModules = new Set<string>();
                  
                  while (queue.length > 0) {
                    const currentId = queue.shift()!;
                    
                    // Skip if we've already processed this module in this traversal
                    if (visited.has(currentId)) {
                      continue;
                    }
                    
                    visited.add(currentId);
                    
                    const info = getModuleInfo(currentId);
                    
                    // No module info available, assume it's sync as a fallback
                    if (!info) {
                      syncModules.add(currentId);
                      continue;
                    }
                    
                    // Entry modules are always sync
                    if (info.isEntry) {
                      syncModules.add(currentId);
                      continue;
                    }
                    
                    // If there are no importers at all, it might be dynamically imported somewhere
                    if (!info.importers || info.importers.length === 0) {
                      // Not marking as sync
                      continue;
                    }
                    
                    // If dynamicImporters is undefined or not an array, handle safely
                    const dynamicImports = Array.isArray(info.dynamicImporters) ? info.dynamicImporters : [];
                    
                    // Check if any importer imports this module statically
                    let hasStaticImporter = false;
                    for (const importer of info.importers) {
                      if (!dynamicImports.includes(importer)) {
                        hasStaticImporter = true;
                        break;
                      }
                    }
                    
                    if (hasStaticImporter) {
                      syncModules.add(currentId);
                    }
                  }
                  
                  return syncModules.has(moduleId);
                }

                const langMatch = /[\\/]locales[\\/](\w+)\.js/.exec(id);
                if (langMatch) {
                  const language = langMatch[1]; // e.g. "en"
                  return `locales/${language}`;
                }

                if (id.includes('packages/core-')) {
                  if (!isModuleSync(id)) {
                    return 'core-async';
                  }
                  return 'core';
                }

                if (id.includes('packages/plugin-')) {
                  if (!isModuleSync(id)) {
                    return 'plugins-async';
                  }
                  return 'plugins';
                }

                if (id.includes('packages/product-')) {
                  if (!isModuleSync(id)) {
                    return 'products-async';
                  }
                  return 'products';
                }

                if (id.includes('@dbeaver/')) {
                  if (!isModuleSync(id)) {
                    return 'dbeaver-async';
                  }
                  return 'dbeaver';
                }

                if (id.includes('node_modules')) {
                  if (!isModuleSync(id)) {
                    return 'vendor-async';
                  }
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
