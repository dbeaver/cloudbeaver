/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const connectionTemplate: PluginManifest = {
  info: {
    name: 'Template Connections plugin',
  },

  providers: [
    () => import('./TemplateConnectionsResource.js').then(m => m.TemplateConnectionsResource),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./TemplateConnectionPluginBootstrap.js').then(m => m.TemplateConnectionPluginBootstrap),
    () => import('./TemplateConnectionsService.js').then(m => m.TemplateConnectionsService),
  ],
};
