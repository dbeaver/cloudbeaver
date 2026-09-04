/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { AIEnginePropertiesResource } from './AIProfiles/AIEnginePropertiesResource.js';
import { AIProfileFormService } from './AIProfiles/AIProfileForm/AIProfileFormService.js';
import { AIProfileFormTabBootstrap } from './AIProfiles/AIProfileForm/AIProfileFormTabBootstrap.js';
import { AIProfilesAdministrationBootstrap } from './AIProfilesAdministrationBootstrap.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-profiles-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(AIProfilesAdministrationBootstrap))
      .addSingleton(Bootstrap, AIProfileFormTabBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(AIEnginePropertiesResource))
      .addSingleton(AIProfilesAdministrationBootstrap)
      .addSingleton(AIEnginePropertiesResource)
      .addSingleton(AIProfileFormService);
  },
});
