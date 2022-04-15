/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';
import type { ISqlEditorTabState } from '@cloudbeaver/plugin-sql-editor';

import type { ISQLEditorData } from './SqlEditor/ISQLEditorData';

export interface ISqlEditorModeProps {
  state: ISqlEditorTabState;
  data: ISQLEditorData;
}

@injectable()
export class SqlEditorModeService {
  readonly tabsContainer: TabsContainer<ISqlEditorModeProps>;

  constructor() {
    this.tabsContainer = new TabsContainer();
  }
}
