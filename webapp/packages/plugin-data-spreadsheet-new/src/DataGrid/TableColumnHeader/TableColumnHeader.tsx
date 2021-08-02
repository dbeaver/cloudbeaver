/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import type { HeaderRendererProps } from 'react-data-grid';
import styled, { css } from 'reshadow';

import { StaticImage } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';
import { ResultSetDataAction } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';
import { OrderButton } from './OrderButton';

const headerStyles = css`
  table-header {
    display: flex;
    align-items: center;
    align-content: center;
    width: 100%;
    cursor: pointer;
  }
  shrink-container {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    overflow: hidden;
  }
  icon {
    display: flex;
    position: relative;
  }
  StaticImage {
    height: 16px;
  }
  name {
    margin-left: 8px;
    font-weight: 400;
    flex-grow: 1;
  }
  readonly-status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid;
  }
  OrderButton {
    margin-left: 4px;
  }
`;

export const TableColumnHeader: React.FC<HeaderRendererProps<any>> = observer(function TableColumnHeader({
  column: calculatedColumn,
}) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const gridSelectionContext = useContext(DataGridSelectionContext);

  if (!tableDataContext || !dataGridContext || !gridSelectionContext) {
    throw new Error('One of the following contexts are missed(data grid context, grid selection context, table data context)');
  }

  const resultIndex = dataGridContext.resultIndex;
  const model = dataGridContext.model;
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const column = data.getColumn(Number(calculatedColumn.key));
  const columnName = calculatedColumn.name as string;

  // TODO we want to get "sortable" property from SqlResultColumn data
  const sortable = model.source.results.length === 1 && !model.source.isDisabled(resultIndex);
  const readOnly = !tableDataContext.isReadOnly() && column?.readOnly;
  const readOnlyStatus = column?.readOnlyStatus ? `(Read-only: ${column.readOnlyStatus})` : '';
  const columnTooltip = `${columnName}${column?.fullTypeName ? ': ' + column.fullTypeName : ''} ${readOnlyStatus}`;

  const handleColumnSelection = (e: React.MouseEvent<HTMLDivElement>) => {
    gridSelectionContext.selectColumn(calculatedColumn.idx, e.ctrlKey || e.metaKey);
  };

  return styled(useStyles(headerStyles))(
    <table-header>
      <shrink-container as='div' title={columnTooltip} onClick={handleColumnSelection}>
        <icon>
          <StaticImage icon={column?.icon} />
          {readOnly && <readonly-status className='rdg-table-header__readonly-status' />}
        </icon>
        <name>{columnName}</name>
      </shrink-container>
      {sortable && column?.label && (
        <OrderButton model={model} resultIndex={resultIndex} attribute={column.label} />
      )}
    </table-header>
  );
});
