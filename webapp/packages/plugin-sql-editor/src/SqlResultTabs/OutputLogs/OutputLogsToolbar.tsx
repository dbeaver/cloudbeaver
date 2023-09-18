/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';

import { Container, Icon, InputField, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

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
    <Container noWrap center gap dense keepSize>
      <InputField
        value={state.searchValue}
        placeholder={translate('sql_editor_output_logs_input_placeholder')}
        icon={
          <div className={s(styles, { searchIcon: true })}>
            <Icon name="search" viewBox="0 0 24 24" />
          </div>
        }
        fill
        onChange={value => state.setSearchValue(value.toString())}
      />
      <Container keepSize>
        <OutputLogsFilterMenu state={state} />
      </Container>
    </Container>
  );
});
