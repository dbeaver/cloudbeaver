/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PluginManifest } from '@dbeaver/core/di';

import { SqlDialectInfoService } from './SqlDialectInfoService';
import { SqlEditorService } from './SqlEditor/SqlEditorService';
import { SqlEditorBootstrap } from './SqlEditorBootstrap';
import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';
import { SqlEditorTabService } from './SqlEditorTabService';
import { SqlResultService } from './SqlResultTabs/SqlResultService';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

export const sqlEditorPluginManifest: PluginManifest = {
  info: {
    name: 'Sql Editor Plugin',
  },

  providers: [
    SqlDialectInfoService,
    SqlEditorTabService,
    SqlResultTabsService,
    SqlResultService,
    SqlEditorService,
    SqlEditorNavigatorService,
  ],

  initialize(services): void {
    services.resolveServiceByClass(SqlEditorBootstrap).bootstrap();
  },
};
