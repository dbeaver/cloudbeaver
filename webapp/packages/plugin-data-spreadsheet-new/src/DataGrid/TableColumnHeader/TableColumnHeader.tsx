/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, StaticImage, useS } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import type { RenderHeaderCellProps } from '@cloudbeaver/plugin-react-data-grid';

import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';
import { OrderButton } from './OrderButton';
import style from './TableColumnHeader.m.css';
import { useTableColumnDnD } from './useTableColumnDnD';

export const TableColumnHeader = observer<RenderHeaderCellProps<any>>(function TableColumnHeader({ column: calculatedColumn }) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const gridSelectionContext = useContext(DataGridSelectionContext);
  const styles = useS(style);

  const resultIndex = dataGridContext.resultIndex;
  const model = dataGridContext.model;

  const dnd = useTableColumnDnD(model, resultIndex, calculatedColumn.columnDataIndex);

  const dataReadonly = getComputed(() => tableDataContext.isReadOnly() || model.isReadonly(resultIndex));
  const sortingDisabled = getComputed(() => !tableDataContext.constraints.supported || !model.source.executionContext?.context);

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

  return (
    <div ref={dnd.setRef} data-s-rearrange={dnd.side} className={s(styles, { header: true, dragging: dnd.data.state.isDragging })}>
      <div title={columnTooltip} className={s(styles, { container: true })} onClick={handleClick}>
        <div className={s(styles, { icon: true })}>
          {icon && <StaticImage icon={icon} className={s(styles, { staticImage: true })} />}
          {!dataReadonly && columnReadOnly && <div className={s(styles, { readonlyStatus: true }, 'rdg-table-header__readonly-status')} />}
        </div>
        <div className={s(styles, { name: true })}>{columnName}</div>
      </div>
      {!sortingDisabled && resultColumn && <OrderButton model={model} resultIndex={resultIndex} attributePosition={resultColumn.position} />}
    </div>
  );
});
