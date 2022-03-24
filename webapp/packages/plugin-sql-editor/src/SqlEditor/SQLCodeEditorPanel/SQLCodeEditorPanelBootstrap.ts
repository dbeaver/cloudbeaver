/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { SqlEditorModeService } from '../../SqlEditorModeService';
import { SQLCodeEditorPanel } from './SQLCodeEditorPanel';

@injectable()
export class SQLCodeEditorPanelBootstrap extends Bootstrap {
  constructor(private readonly sqlEditorModeService: SqlEditorModeService) {
    super();
  }

  register(): void | Promise<void> {
    this.sqlEditorModeService.tabsContainer.add({
      key: 'sql-editor',
      icon: '/icons/sql_script_sm.svg',
      name: 'sql_editor_script_editor',
      panel: () => SQLCodeEditorPanel,
    });
  }

  load(): void | Promise<void> { }
}
