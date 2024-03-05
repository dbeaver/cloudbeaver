/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { SqlEditorBootstrap } from './SqlEditorBootstrap';
import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';
import { SqlEditorTabService } from './SqlEditorTabService';

export const sqlEditorTabPluginManifest: PluginManifest = {
  info: {
    name: 'Sql Editor Navigation Tab Plugin',
  },

  providers: [SqlEditorBootstrap, SqlEditorTabService, SqlEditorNavigatorService, LocaleService],
};
