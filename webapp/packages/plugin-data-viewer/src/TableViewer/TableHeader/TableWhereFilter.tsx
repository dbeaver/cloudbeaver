/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';
import { InlineEditor } from '@cloudbeaver/core-ui';

import type { ITableHeaderPlaceholderProps } from './TableHeaderService';
import { useWhereFilter } from './useWhereFilter';

const styles = css`
  InlineEditor {
    composes: theme-background-surface theme-text-on-surface from global;
    flex: 1;
    height: 24px;
  }
`;

export const TableWhereFilter: PlaceholderComponent<ITableHeaderPlaceholderProps> = observer(function TableWhereFilter({ model, resultIndex }) {
  const translate = useTranslate();
  const state = useWhereFilter(model, resultIndex);

  return styled(styles)(
    <InlineEditor
      name="data_where"
      value={state.filter}
      placeholder={translate(state.constraints?.supported ? 'table_header_sql_expression' : 'table_header_sql_expression_not_supported')}
      controlsPosition="inside"
      edited={!!state.filter}
      disableSave={!state.applicableFilter}
      disabled={state.disabled}
      simple
      onSave={state.apply}
      onChange={state.set}
    />,
  );
});
