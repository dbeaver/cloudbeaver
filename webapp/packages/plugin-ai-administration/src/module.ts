/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { AIAdministrationBootstrap } from './AIAdministrationBootstrap.js';
import { AIAdministrationNavigationService } from './AIAdministrationNavigationService.js';
import { AIAdministrationTabsService } from './AIAdministrationTabsService.js';
import { AdministrationAISettingsFormService } from './AISettingsForm/AdministrationAISettingsFormService.js';
import { AISettingsService } from './AISettingsService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-administration',

  services: () => [
    AIAdministrationBootstrap,
    AISettingsService,
    AIAdministrationTabsService,
    AdministrationAISettingsFormService,
    AIAdministrationNavigationService,
  ],
  bootstraps: () => [AIAdministrationBootstrap, LocaleService, AIAdministrationTabsService],
});
