/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IServiceInjector, PluginManifest } from '@dbeaver/core/di';

import { AuthenticationService } from './AuthenticationService';
import { Bootstrap } from './Bootstrap';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication',
  },

  providers: [
    AuthenticationService,
  ],

  async initialize(services: IServiceInjector) {
    services
      .resolveServiceByClass(Bootstrap)
      .bootstrap();
  },
};
