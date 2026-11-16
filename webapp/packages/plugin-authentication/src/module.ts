/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { AuthenticationLocaleService } from './AuthenticationLocaleService.js';
import { AuthenticationService } from './AuthenticationService.js';
import { AuthDialogService } from './Dialog/AuthDialogService.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { UserLoadingErrorDialogBootstrap } from './UserLoadingErrorDialogBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-authentication',

  services: () => [UserLoadingErrorDialogBootstrap, PluginBootstrap, AuthDialogService, AuthenticationService],
  bootstraps: () => [AuthenticationLocaleService, UserLoadingErrorDialogBootstrap, PluginBootstrap, AuthenticationService],
});
