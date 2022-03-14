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

import { getComputed, StaticImage } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

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
  }
  shrink-container {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    overflow: hidden;
    cursor: pointer;
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

export const TableColumnHeader = observer<HeaderRendererProps<any>>(function TableColumnHeader({
  column: calculatedColumn,
}) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const gridSelectionContext = useContext(DataGridSelectionContext);

  const resultIndex = dataGridContext.resultIndex;
  const model = dataGridContext.model;

  const dataReadonly = getComputed(() => tableDataContext.isReadOnly() || model.isReadonly());
  const sortingDisabled = getComputed(
    () => !tableDataContext.constraints.supported || !model.source.executionContext?.context
  );

  let resultColumn: SqlResultColumn | undefined;
  let icon = calculatedColumn.icon;
  let columnName = calculatedColumn.name as string;
  let columnReadOnly = !calculatedColumn.editable;
  let columnTooltip: string = columnName;

  if (calculatedColumn.columnDataIndex !== null) {
    const column = tableDataContext.data.getColumn(calculatedColumn.columnDataIndex);

    if (column) {
      resultColumn = column;
      columnName = column.label!;
      icon = column.icon;
      columnReadOnly ||= tableDataContext.format.isReadOnly({ column: calculatedColumn.columnDataIndex });

      columnTooltip = columnName;

      if (column.fullTypeName) {
        columnTooltip += `: ${column.fullTypeName}`;
      }

      if (column.readOnlyStatus) {
        columnTooltip += ` (Read-only: ${column.readOnlyStatus})`;
      }
    }
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    gridSelectionContext.selectColumn(calculatedColumn.idx, event.ctrlKey || event.metaKey);
    dataGridContext.focus();
  }

  return styled(useStyles(headerStyles))(
    <table-header>
      <shrink-container as='div' title={columnTooltip} onClick={handleClick}>
        <icon>
          {icon && <StaticImage icon={icon} />}
          {!dataReadonly && columnReadOnly && <readonly-status className='rdg-table-header__readonly-status' />}
        </icon>
        <name>{columnName}</name>
      </shrink-container>
      {!sortingDisabled && resultColumn && (
        <OrderButton
          model={model}
          resultIndex={resultIndex}
          attributePosition={resultColumn.position}
        />
      )}
    </table-header>
  );
});
