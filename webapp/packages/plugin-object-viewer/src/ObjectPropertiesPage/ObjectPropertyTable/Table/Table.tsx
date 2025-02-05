/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import { type IScrollState, Link, s, useControlledScroll, useExecutor, useS, useTable, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type DBObject, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useTabLocalState } from '@cloudbeaver/core-ui';
import { isDefined, TextTools } from '@cloudbeaver/core-utils';
import { DataGrid } from '@cloudbeaver/plugin-data-grid';

import { getValue } from '../../helpers.js';
import { ObjectPropertyTableFooter } from '../ObjectPropertyTableFooter.js';
import { CellFormatter } from './CellFormatter.js';
import type { IDataColumn } from './Column.js';
import { ColumnIcon } from './Columns/ColumnIcon/ColumnIcon.js';
import { ColumnSelect } from './Columns/ColumnSelect/ColumnSelect.js';
import { HeaderRenderer } from './HeaderRenderer.js';
import classes from './Table.module.css';
import { TableContext } from './TableContext.js';
import { useTableData } from './useTableData.js';

const CELL_FONT = '400 12px Roboto';
const COLUMN_FONT = '700 12px Roboto';
const CELL_PADDING = 16;
const CELL_BORDER = 2;

export interface TableProps {
  objects: DBObject[];
  hasNextPage: boolean;
  loadMore: () => void;
}

function getMeasuredCells(columns: ObjectPropertyInfo[], rows: DBObject[]) {
  const columnNames = columns.map(column => column.displayName?.toUpperCase()).filter(isDefined);
  const rowStrings: string[] = Array(columns.length).fill('');

  for (const row of rows.slice(0, 100)) {
    if (row.object?.properties) {
      for (let i = 0; i < row.object.properties.length; i++) {
        const value = getValue(row.object.properties[i]!.value);

        if (value.length > rowStrings[i]!.length) {
          rowStrings[i] = value;
        }
      }
    }
  }

  const columnsWidth = TextTools.getWidth({
    font: COLUMN_FONT,
    text: columnNames,
  }).map(width => width + CELL_PADDING + CELL_BORDER);

  const cellsWidth = TextTools.getWidth({
    font: CELL_FONT,
    text: rowStrings,
  }).map(width => width + CELL_PADDING + CELL_BORDER);

  const widthData = columnNames.map((_, i) => Math.max(columnsWidth[i]!, cellsWidth[i] ?? 0));

  return widthData;
}

const CUSTOM_COLUMNS = [ColumnSelect, ColumnIcon];

export const Table = observer<TableProps>(function Table({ objects, hasNextPage, loadMore }) {
  const styles = useS(classes);
  const navTreeResource = useService(NavTreeResource);

  const [tableContainer, setTableContainerRef] = useState<HTMLDivElement | null>(null);
  const translate = useTranslate();

  const tableState = useTable();
  const tabLocalState = useTabLocalState<IScrollState>(() => ({ scrollTop: 0, scrollLeft: 0 }));

  const scrollBox = (tableContainer?.firstChild as HTMLDivElement | undefined) ?? null;
  useControlledScroll(scrollBox, tabLocalState);

  const baseObject = objects.slice().sort((a, b) => (b.object?.properties?.length || 0) - (a.object?.properties?.length || 0));

  const properties = baseObject[0]?.object?.properties ?? [];
  const measuredCells = getMeasuredCells(properties, objects);

  const dataColumns: IDataColumn[] = properties.map((property, index) => ({
    key: property.id!,
    name: property.displayName ?? '',
    description: property.description,
    columnDataIndex: null,
    width: Math.min(300, measuredCells[index]!),
    minWidth: 40,
    resizable: true,
    renderCell: props => <CellFormatter {...props} />,
    renderHeaderCell: props => <HeaderRenderer {...props} />,
  }));

  const tableData = useTableData(dataColumns, CUSTOM_COLUMNS);

  const handleScroll = useCallback(
    async (event: React.UIEvent<HTMLDivElement>) => {
      if (isAtBottom(event)) {
        loadMore();
      }
    },
    [loadMore],
  );

  useExecutor({
    executor: navTreeResource.onItemDelete,
    handlers: [
      function handleNodeDelete(nodeId) {
        tableState.unselect(nodeId);
      },
    ],
  });

  if (objects.length === 0) {
    return null;
  }

  return (
    <TableContext.Provider value={{ tableData, tableState }}>
      <div ref={setTableContainerRef} className={s(styles, { container: true })}>
        <DataGrid
          className={s(styles, { dataGrid: true })}
          rows={objects}
          // @ts-ignore
          rowKeyGetter={row => row.id}
          columns={tableData.columns}
          rowHeight={40}
          onScroll={handleScroll}
        />
        {hasNextPage && (
          <div className={s(styles, { info: true })}>
            <Link title={translate('app_navigationTree_limited')} onClick={loadMore}>
              {translate('ui_load_more')}
            </Link>
          </div>
        )}
        <ObjectPropertyTableFooter className={s(styles, { objectPropertyTableFooter: true })} state={tableState} />
      </div>
    </TableContext.Provider>
  );
});

function isAtBottom(event: React.UIEvent<HTMLDivElement>): boolean {
  const target = event.target as HTMLDivElement;
  return target.clientHeight + target.scrollTop + target.clientHeight * 0.3 > target.scrollHeight;
}
