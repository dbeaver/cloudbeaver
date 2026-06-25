/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { SqlResultTabsService } from '@cloudbeaver/plugin-sql-editor';

import { SqlExecutionPlanService } from './SqlExecutionPlanService.js';

const SqlExecutionPlanPanel = importLazyComponent(() => import('./SqlExecutionPlanPanel.js').then(module => module.SqlExecutionPlanPanel));

@injectable(() => [SqlResultTabsService, SqlExecutionPlanService])
export class SqlExecutionPlanResultBootstrap extends Bootstrap {
  constructor(
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly sqlExecutionPlanService: SqlExecutionPlanService,
  ) {
    super();

    this.sqlResultTabsService.onResultTabClose.addHandler(({ state, tabId }) => {
      this.sqlExecutionPlanService.removeExecutionPlanTab(state, tabId);
    });
  }

  override register(): void {
    this.sqlResultTabsService.resultPanels.add(SqlExecutionPlanPanel, 0, ({ tabId }) => !this.sqlExecutionPlanService.has(tabId));
  }
}
