/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { SqlExecutionPlanViewService } from './SqlExecutionPlanViewService.js';

const ExecutionPlanTreeView = importLazyComponent(() => import('./ExecutionPlanTreeView.js').then(m => m.ExecutionPlanTreeView));

@injectable(() => [SqlExecutionPlanViewService])
export class SqlExecutionPlanViewBootstrap extends Bootstrap {
  constructor(private readonly sqlExecutionPlanViewService: SqlExecutionPlanViewService) {
    super();
  }

  override register(): void {
    this.sqlExecutionPlanViewService.tabs.add({
      key: 'table',
      name: 'plugin_sql_execution_plan_view_table',
      icon: 'table-icon',
      order: 0,
      panel: () => ExecutionPlanTreeView,
    });
  }
}
