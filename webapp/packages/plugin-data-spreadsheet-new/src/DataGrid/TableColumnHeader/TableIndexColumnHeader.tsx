/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import type { HeaderRendererProps } from 'react-data-grid';
import styled, { css } from 'reshadow';

import { IconOrImage } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';

const styles = css`
  container {
    width: 100%;
    cursor: pointer;
  }
  IconOrImage {
    width: 10px;
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
  }
`;

export const TableIndexColumnHeader: React.FC<HeaderRendererProps<any>> = function TableIndexColumnHeader(props) {
  const selectionContext = useContext(DataGridSelectionContext);
  const tableDataContext = useContext(TableDataContext);
  const translate = useTranslate();

  if (!tableDataContext || !selectionContext) {
    throw new Error('One of the following contexts are missed(table data context, grid selection context)');
  }

  return styled(styles)(
    <container as='div' title={translate('data_grid_table_index_column_tooltip')} onClick={() => selectionContext.selectTable()}>
      {tableDataContext.isReadOnly() && <IconOrImage icon='/icons/lock.png' />}
      {props.column.name}
    </container>
  );
};
