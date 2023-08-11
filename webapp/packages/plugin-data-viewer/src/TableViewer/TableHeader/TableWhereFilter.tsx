/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMenuState } from 'reakit';
import styled, { css } from 'reshadow';

import { PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { InlineEditor, useHints } from '@cloudbeaver/core-ui';

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

  const menu = useMenuState({
    placement: 'bottom-end',
    gutter: 1,
  });

  const mapColumnsToHints = (columns: SqlResultColumn[]) =>
    columns.map(column => ({ key: column.label || '', value: column.label || '', icon: column.icon || '' }));

  const hintsState = useHints(menu, undefined, model, resultIndex, mapColumnsToHints);

  return styled(styles)(
    <InlineEditor
      name="data_where"
      value={state.filter}
      placeholder={translate(state.constraints?.supported ? 'table_header_sql_expression' : 'table_header_sql_expression_not_supported')}
      controlsPosition="inside"
      edited={!!state.filter}
      disableSave={!state.applicableFilter}
      disabled={state.disabled}
      hintsState={hintsState}
      simple
      onSave={state.apply}
      onChange={state.set}
    />,
  );
});
