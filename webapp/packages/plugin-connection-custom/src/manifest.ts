/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PluginManifest } from '@cloudbeaver/core-di';

import { CustomConnectionPluginBootstrap } from './CustomConnectionPluginBootstrap';
import { CustomConnectionService } from './CustomConnectionService';
import { LocaleService } from './LocaleService';

export const customConnectionPluginManifest: PluginManifest = {
  info: {
    name: 'Custom connection plugin',
  },

  providers: [
    CustomConnectionService,
    LocaleService,
  ],

  initialize(services): void {
    services
      .resolveServiceByClass(CustomConnectionPluginBootstrap)
      .bootstrap();
  },
};
