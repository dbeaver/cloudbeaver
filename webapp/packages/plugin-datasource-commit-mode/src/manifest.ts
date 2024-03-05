/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { CommitModeManagerBootstrap } from './CommitModeManagerBootstrap';
import { CommitModeManagerService } from './CommitModeManagerService';
import { LocaleService } from './LocaleService';

export const datasourceCommitModePlugin: PluginManifest = {
  info: {
    name: 'Datasource commit mode plugin',
  },

  providers: [CommitModeManagerBootstrap, LocaleService, CommitModeManagerService],
};
