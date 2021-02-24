/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { ConfigurationWizardPagesBootstrapService } from './ConfigurationWizard/ConfigurationWizardPagesBootstrapService';
import { ServerConfigurationService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationService';
import { LocaleService } from './LocaleService';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication',
  },

  providers: [
    ServerConfigurationService,
    ConfigurationWizardPagesBootstrapService,
    LocaleService,
  ],
};
