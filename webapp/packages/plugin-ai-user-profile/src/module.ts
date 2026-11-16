/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';

import { AIProfileCredentialsFormTabBootstrap } from './AIProfileCredentialsForm/AIProfileCredentialsFormTabBootstrap.js';
import { AIProfileCredentialsPanelService } from './AIProfileCredentialsPanelService.js';
import { AIProfilesSettingsService } from './AIProfilesSettingsService.js';
import { AIUserProfileBootstrap } from './AIUserProfileBootstrap.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-user-profile',

  services: () => [AIProfilesSettingsService, AIProfileCredentialsPanelService],
  bootstraps: () => [AIProfileCredentialsFormTabBootstrap, LocaleService, AIUserProfileBootstrap],
});
