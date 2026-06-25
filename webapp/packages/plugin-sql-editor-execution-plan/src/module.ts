/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService.js';
import { SqlExecutionPlanMenuBootstrap } from './SqlExecutionPlanMenuBootstrap.js';
import { SqlExecutionPlanResultBootstrap } from './SqlExecutionPlanResultBootstrap.js';
import { SqlExecutionPlanService } from './SqlExecutionPlanService.js';
import { SqlExecutionPlanViewBootstrap } from './SqlExecutionPlanViewBootstrap.js';
import { SqlExecutionPlanViewService } from './SqlExecutionPlanViewService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor-execution-plan',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(SqlExecutionPlanService)
      .addSingleton(SqlExecutionPlanViewService)
      .addSingleton(Bootstrap, SqlExecutionPlanViewBootstrap)
      .addSingleton(Bootstrap, SqlExecutionPlanMenuBootstrap)
      .addSingleton(Bootstrap, SqlExecutionPlanResultBootstrap);
  },
});
