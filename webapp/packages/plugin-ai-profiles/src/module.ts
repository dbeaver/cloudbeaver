/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { AIProfileCredentialsService } from './AIProfileCredentials/AIProfileCredentialsService.js';
import { AIProfileAuthorizationService } from './AIProfileCredentials/AIProfileAuthorizationService.js';
import { AIProfileCredentialsFormService } from './AIProfileCredentials/AIProfileCredentialsFormService.js';
import { AIProfilesResource } from './AIProfilesResource.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-profiles',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(AIProfilesResource))
      .addSingleton(AIProfilesResource)
      .addSingleton(AIProfileCredentialsFormService)
      .addSingleton(AIProfileAuthorizationService)
      .addSingleton(AIProfileCredentialsService);
  },
});
