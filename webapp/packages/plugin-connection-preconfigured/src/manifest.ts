/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PluginManifest } from '@cloudbeaver/core-di';

import { BasicConnectionPluginBootstrap } from './BasicConnectionPluginBootstrap';
import { BasicConnectionService } from './BasicConnectionService';
import { DataSourcesResource } from './DataSourcesResource';
import { LocaleService } from './LocaleService';

export const basicConnectionPluginManifest: PluginManifest = {
  info: {
    name: 'Basic connection plugin',
  },

  providers: [
    BasicConnectionService,
    DataSourcesResource,
    LocaleService,
  ],

  initialize(services): void {
    services
      .resolveServiceByClass(BasicConnectionPluginBootstrap)
      .bootstrap();
  },
};
