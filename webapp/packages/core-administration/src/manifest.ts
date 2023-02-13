/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { AdministrationItemService } from './AdministrationItem/AdministrationItemService';
import { AdministrationLocaleService } from './AdministrationLocaleService';
import { AdministrationScreenService } from './AdministrationScreen/AdministrationScreenService';
import { ConfigurationWizardService } from './AdministrationScreen/ConfigurationWizard/ConfigurationWizardService';
import { AdministrationSettingsService } from './AdministrationSettingsService';
import { PermissionsResource } from './PermissionsResource';


export const manifest: PluginManifest = {
  info: {
    name: 'Core Administration',
  },

  providers: [
    AdministrationItemService,
    PermissionsResource,
    AdministrationScreenService,
    ConfigurationWizardService,
    AdministrationLocaleService,
    AdministrationSettingsService,
  ],
};
