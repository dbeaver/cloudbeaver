/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, StaticImage, useS } from '@cloudbeaver/core-blocks';

import { DataGridContext } from '../DataGridContext.js';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext.js';
import { TableDataContext } from '../TableDataContext.js';
import style from './TableColumnHeader.module.css';
import { useTableColumnDnD } from './useTableColumnDnD.js';

interface Props {
  colIdx: number;
}

export const TableColumnHeader = observer<Props>(function TableColumnHeader({ colIdx }) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const gridSelectionContext = useContext(DataGridSelectionContext);
  const styles = useS(style);

  const resultIndex = dataGridContext.resultIndex;
  const model = dataGridContext.model;

  const columnInfo = tableDataContext.getColumn(colIdx)!;
  const dnd = useTableColumnDnD(model, resultIndex, columnInfo.key);

  const dataReadonly = getComputed(() => model.isReadonly(resultIndex));
  const hasElementIdentifier = getComputed(() => model.hasElementIdentifier(resultIndex));

  let icon: string | undefined;
  let columnName: string | undefined;
  let columnReadOnly = false;
  let columnTooltip: string | undefined;

  if (columnInfo.key !== null) {
    const column = tableDataContext.data.getColumn(columnInfo.key);

    if (column) {
      columnName = column.label!;
      icon = column.icon;
      columnReadOnly ||= tableDataContext.format.isReadOnly({ column: columnInfo.key });

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
    gridSelectionContext.selectColumn(colIdx, event.ctrlKey || event.metaKey);
    dataGridContext.focus();
  }

  return (
    <div
      ref={dnd.setRef}
      title={columnTooltip}
      data-s-rearrange={dnd.side}
      className={s(styles, { header: true, dragging: dnd.data.state.isDragging })}
      onClick={handleClick}
    >
      {dataReadonly && colIdx === 0 && (
        <div className={s(styles, { readonlyStatus: true, independent: true }, 'rdg-table-header__readonly-status')} />
      )}
      {icon && (
        <div className={s(styles, { icon: true })}>
          <StaticImage icon={icon} className={s(styles, { staticImage: true })} />
          {columnReadOnly && hasElementIdentifier && !dataReadonly && (
            <div className={s(styles, { readonlyStatus: true }, 'rdg-table-header__readonly-status')} />
          )}
        </div>
      )}
      <div className={s(styles, { name: true })}>{columnName}</div>
    </div>
  );
});
