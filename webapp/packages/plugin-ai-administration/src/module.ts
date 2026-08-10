/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { AISettingsResource } from './AISettingsResource.js';
import { AISettingsService } from './AISettingsService.js';
import { AIEnginePropertiesResource } from './AIProfiles/AIEnginePropertiesResource.js';
import { AIProfilesResource } from './AIProfiles/AIProfilesResource.js';
import { AIProfileFormService } from './AIProfiles/AIProfileForm/AIProfileFormService.js';
import { AIProfileFormTabBootstrap } from './AIProfiles/AIProfileForm/AIProfileFormTabBootstrap.js';
import { AdministrationAISettingsFormService } from './AISettingsForm/AdministrationAISettingsFormService.js';
import { AIAdministrationBootstrap } from './AIAdministrationBootstrap.js';
import { AIAdministrationTabsService } from './AIAdministrationTabsService.js';
import { AIAdministrationNavigationService } from './AIAdministrationNavigationService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(AIAdministrationBootstrap))
      .addSingleton(AIAdministrationBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(AIAdministrationTabsService))
      .addSingleton(Dependency, proxy(AISettingsResource))
      .addSingleton(Dependency, proxy(AIProfilesResource))
      .addSingleton(Dependency, proxy(AIEnginePropertiesResource))
      .addSingleton(AISettingsResource)
      .addSingleton(AISettingsService)
      .addSingleton(AIProfilesResource)
      .addSingleton(AIEnginePropertiesResource)
      .addSingleton(AIProfileFormService)
      .addSingleton(Bootstrap, AIProfileFormTabBootstrap)
      .addSingleton(AIAdministrationTabsService)
      .addSingleton(AdministrationAISettingsFormService)
      .addSingleton(AIAdministrationNavigationService);
  },
});
