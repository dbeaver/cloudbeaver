/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { TemplateConnectionPluginBootstrap } from './TemplateConnectionPluginBootstrap';
import { TemplateConnectionsResource } from './TemplateConnectionsResource';
import { TemplateConnectionsService } from './TemplateConnectionsService';

export const connectionTemplate: PluginManifest = {
  info: {
    name: 'Template Connections plugin',
  },

  providers: [TemplateConnectionsResource, LocaleService, TemplateConnectionPluginBootstrap, TemplateConnectionsService],
};
