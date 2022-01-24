/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import type { HeaderRendererProps } from 'react-data-grid';
import styled, { css } from 'reshadow';

import { getComputed, IconOrImage } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';

const styles = css`
  container {
    width: 100%;
    cursor: pointer;
  }
  IconOrImage {
    cursor: auto;
    width: 10px;
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
  }
`;

export const TableIndexColumnHeader = observer<HeaderRendererProps<any>>(function TableIndexColumnHeader(props) {
  const dataGridContext = useContext(DataGridContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const tableDataContext = useContext(TableDataContext);
  const translate = useTranslate();

  if (!tableDataContext || !selectionContext || !dataGridContext) {
    throw new Error('Contexts required');
  }

  const readonly = getComputed(() => (
    tableDataContext.isReadOnly()
    || dataGridContext.model.isReadonly()
  ));

  function handleClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    selectionContext.selectTable();
    dataGridContext.focus();
  }

  return styled(styles)(
    <container title={translate('data_grid_table_index_column_tooltip')} onClick={handleClick}>
      {readonly && <IconOrImage title={translate('data_grid_table_readonly_tooltip')} icon='/icons/lock.png' />}
      {props.column.name}
    </container>
  );
});
