/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { DevToolsService } from '@cloudbeaver/plugin-devtools';
import { ESqlDataSourceFeatures, SqlEditorModeService } from '@cloudbeaver/plugin-sql-editor';

import { SQLCodeEditorPanel } from './SQLCodeEditorPanel';

@injectable()
export class SQLCodeEditorPanelService {
  constructor(
    private readonly sqlEditorModeService: SqlEditorModeService,
    private readonly devToolsService: DevToolsService,
  ) { }

  registerPanel(): void | Promise<void> {
    this.sqlEditorModeService.tabsContainer.add({
      key: 'sql-editor-new',
      icon: '/icons/sql_script_sm.svg',
      name: 'codemirror6',
      isHidden: (_, props) => !this.devToolsService.isCodemirror
        || props?.data.dataSource?.hasFeature(ESqlDataSourceFeatures.script) !== true,
      panel: () => SQLCodeEditorPanel,
    });
  }
}