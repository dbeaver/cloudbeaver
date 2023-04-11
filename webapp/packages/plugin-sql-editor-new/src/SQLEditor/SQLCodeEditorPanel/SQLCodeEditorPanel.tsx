/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { LANG_EXT } from '@cloudbeaver/plugin-codemirror6';
import type { ISqlEditorModeProps } from '@cloudbeaver/plugin-sql-editor';

import { SQLCodeEditorLoader } from '../SQLCodeEditor/SQLCodeEditorLoader';

export const SQLCodeEditorPanel: TabContainerPanelComponent<ISqlEditorModeProps> = observer(function SQLCodeEditorPanel({
  data,
}) {
  return (
    <SQLCodeEditorLoader
      value={data.value}
      extensions={[LANG_EXT.sql()]}
    />
  );
});