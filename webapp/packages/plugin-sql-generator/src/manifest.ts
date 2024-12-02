/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const sqlGeneratorPlugin: PluginManifest = {
  info: {
    name: 'Sql Editor Generator plugin',
  },

  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./SqlGenerators/SqlGeneratorsBootstrap.js').then(m => m.SqlGeneratorsBootstrap),
    () => import('./SqlGenerators/SqlGeneratorsResource.js').then(m => m.SqlGeneratorsResource),
    () => import('./ScriptPreview/ScriptPreviewService.js').then(m => m.ScriptPreviewService),
    () => import('./GeneratorMenuBootstrap.js').then(m => m.GeneratorMenuBootstrap),
  ],
};
