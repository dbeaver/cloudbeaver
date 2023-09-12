/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { InlineEditor } from '@cloudbeaver/core-ui';

import style from './OutputLogsToolbar.m.css';
import { OutputLogsFilterMenu } from './OutputLogTypesFilterMenu';
import type { SqlOutputLogsPanelState } from './useOutputLogsPanelState';

interface Props {
  state: SqlOutputLogsPanelState;
}

export const OutputLogsToolbar = observer<Props>(function SqlOutputLogsToolbar({ state }) {
  const styles = useS(style);
  const translate = useTranslate();

  return (
    <div className={s(styles, { container: true })}>
      <InlineEditor
        className={s(styles, { inlineEditor: true })}
        value={state.searchValue}
        placeholder={translate('sql_editor_output_logs_input_placeholder')}
        hideSave
        hideCancel
        simple
        onChange={state.setSearchValue}
      />
      <OutputLogsFilterMenu state={state} />
    </div>
  );
});
