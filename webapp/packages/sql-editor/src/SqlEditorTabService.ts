/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavigationTabsService, TabHandlerOptions } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';

import { SqlEditorManagerService } from './SqlEditorManagerService';
import { SqlEditorTab } from './SqlEditorTab';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';

@injectable()
export class SqlEditorTabService {

  constructor(private navigationTabsService: NavigationTabsService,
              private sqlEditorManagerService: SqlEditorManagerService) {
  }

  registerTabHandler() {
    const tabHandler: TabHandlerOptions = {
      key: sqlEditorTabHandlerKey,
      name: 'Sql Editor',
      icon: '/icons/sql_script.png',
      navigatorId: 'sql-editor',
      order: 3,
      priority: 1,
      getTabHandlerComponent: () => SqlEditorTab,
      isActive: this.sqlEditorManagerService.isSqlEditorEntity,
      onRestore: this.sqlEditorManagerService.handleTabRestore.bind(this.sqlEditorManagerService),
      onClose: this.sqlEditorManagerService.handleTabClose.bind(this.sqlEditorManagerService),
    };
    this.navigationTabsService.registerTabHandler(tabHandler);
  }

}
