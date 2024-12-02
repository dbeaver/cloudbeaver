/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { ResourceSqlDataSource } from './ResourceSqlDataSource.js';

@injectable()
export class SqlEditorTabResourceService {
  constructor(
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlDataSourceService: SqlDataSourceService,
  ) {}

  getResourceTab(key: string) {
    const dataSource = this.sqlDataSourceService.dataSources.find(
      ([, dataSource]) => dataSource instanceof ResourceSqlDataSource && dataSource.resourceKey === key,
    );

    const tab = this.sqlEditorTabService.sqlEditorTabs.find(tab => dataSource && tab.handlerState.editorId === dataSource[0]);

    return tab;
  }
}
