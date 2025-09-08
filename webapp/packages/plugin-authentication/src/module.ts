/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { UserLoadingErrorDialogBootstrap } from './UserLoadingErrorDialogBootstrap.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { AuthDialogService } from './Dialog/AuthDialogService.js';
import { AuthenticationService } from './AuthenticationService.js';
import { AuthenticationLocaleService } from './AuthenticationLocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-authentication',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, AuthenticationLocaleService)
      .addSingleton(Bootstrap, proxy(UserLoadingErrorDialogBootstrap))
      .addSingleton(Bootstrap, proxy(PluginBootstrap))
      .addSingleton(Bootstrap, proxy(AuthenticationService))
      .addSingleton(UserLoadingErrorDialogBootstrap)
      .addSingleton(PluginBootstrap)
      .addSingleton(AuthDialogService)
      .addSingleton(AuthenticationService);
  },
});
