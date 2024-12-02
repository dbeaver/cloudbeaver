/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { ESqlDataSourceFeatures, SqlEditorModeService } from '@cloudbeaver/plugin-sql-editor';

const SQLCodeEditorPanel = importLazyComponent(() => import('./SQLCodeEditorPanel.js').then(module => module.SQLCodeEditorPanel));

@injectable()
export class SQLCodeEditorPanelService {
  constructor(private readonly sqlEditorModeService: SqlEditorModeService) {}

  registerPanel(): void | Promise<void> {
    this.sqlEditorModeService.tabsContainer.add({
      key: 'sql-editor',
      icon: '/icons/sql_script_sm.svg',
      name: 'sql_editor_script_editor',
      isHidden: (_, props) => props?.data.dataSource?.hasFeature(ESqlDataSourceFeatures.script) !== true,
      panel: () => SQLCodeEditorPanel,
    });
  }
}
