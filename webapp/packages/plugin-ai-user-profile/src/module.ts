/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';

import { AIUserProfileBootstrap } from './AIUserProfileBootstrap.js';
import { AIProfileCredentialsFormTabBootstrap } from './AIProfileCredentialsForm/AIProfileCredentialsFormTabBootstrap.js';
import { AIProfileCredentialsPanelService } from './AIProfileCredentialsPanelService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-user-profile',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(AIProfileCredentialsPanelService)
      .addSingleton(Bootstrap, AIProfileCredentialsFormTabBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, AIUserProfileBootstrap);
  },
});
