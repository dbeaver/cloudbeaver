/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { ConnectionSchemaManagerBootstrap } from './ConnectionSchemaManager/ConnectionSchemaManagerBootstrap';
import { ConnectionSchemaManagerService } from './ConnectionSchemaManager/ConnectionSchemaManagerService';
import { LocaleService } from './LocaleService';
import { PluginBootstrap } from './PluginBootstrap';

export const datasourceContextSwitchPluginManifest: PluginManifest = {
  info: {
    name: 'Datasource context switch plugin',
  },

  providers: [PluginBootstrap, ConnectionSchemaManagerService, ConnectionSchemaManagerBootstrap, LocaleService],
};
