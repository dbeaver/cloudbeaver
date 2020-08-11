/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { TemplateConnectionPluginBootstrap } from './TemplateConnectionPluginBootstrap';
import { TemplateConnectionsResource } from './TemplateConnectionsResource';

export const connectionTemplate: PluginManifest = {
  info: {
    name: 'Connection template plugin',
  },

  providers: [
    TemplateConnectionsResource,
    LocaleService,
  ],

  initialize(services): void {
    services
      .resolveServiceByClass(TemplateConnectionPluginBootstrap)
      .bootstrap();
  },
};
