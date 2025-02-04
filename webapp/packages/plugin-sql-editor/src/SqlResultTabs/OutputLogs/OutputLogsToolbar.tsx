/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Filter, useTranslate } from '@cloudbeaver/core-blocks';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState.js';
import { OutputLogsMenu } from './OutputLogsMenu.js';
import type { SqlOutputLogsPanelState } from './useOutputLogsPanelState.js';

interface Props {
  state: SqlOutputLogsPanelState;
  sqlEditorTabState: ISqlEditorTabState;
}

export const OutputLogsToolbar = observer<Props>(function OutputLogsToolbar({ state, sqlEditorTabState }) {
  const translate = useTranslate();

  return (
    <Container noWrap center gap dense keepSize>
      <Filter
        value={state.searchValue}
        placeholder={translate('sql_editor_output_logs_input_placeholder')}
        onChange={value => state.setSearchValue(value.toString())}
      />
      <Container keepSize>
        <OutputLogsMenu sqlEditorTabState={sqlEditorTabState} />
      </Container>
    </Container>
  );
});
