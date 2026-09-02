/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { AiEnginesResource } from './AiEnginesResource.js';
import { AIProfileCredentialsService } from './AIProfileCredentialsService.js';
import { UserAIProfileResource } from './UserAIProfileResource.js';
import { AISettingsResource } from './AISettingsResource.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(AiEnginesResource))
      .addSingleton(Dependency, proxy(UserAIProfileResource))
      .addSingleton(Dependency, proxy(AISettingsResource))
      .addSingleton(AiEnginesResource)
      .addSingleton(UserAIProfileResource)
      .addSingleton(AISettingsResource)
      .addSingleton(AIProfileCredentialsService);
  },
});
