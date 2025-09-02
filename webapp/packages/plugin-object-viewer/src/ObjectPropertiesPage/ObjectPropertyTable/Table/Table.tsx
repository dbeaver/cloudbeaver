/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState, useMemo, useCallback, memo } from 'react';

import { type IScrollState, Link, s, useControlledScroll, useExecutor, useS, useTable, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type DBObject, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { useTabLocalState } from '@cloudbeaver/core-ui';
import { DataGrid, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';
import { getObjectPropertyDisplayValue } from '@cloudbeaver/core-sdk';

import { ObjectPropertyTableFooter } from '../ObjectPropertyTableFooter.js';
import classes from './Table.module.css';
import { ObjectMenuCell } from './ObjectMenuCell.js';
import { SelectorFormatter } from './Columns/ColumnSelect/SelectorFormatter.js';

export interface TableProps {
  objects: DBObject[];
  hasNextPage: boolean;
  loadMore: () => void;
}

export const Table = memo(
  observer<TableProps>(function Table({ objects, hasNextPage, loadMore }) {
    const styles = useS(classes);
    const navTreeResource = useService(NavTreeResource);

    const [tableContainer, setTableContainerRef] = useState<HTMLDivElement | null>(null);
    const translate = useTranslate();

    const tableState = useTable();
    const tabLocalState = useTabLocalState<IScrollState>(() => ({ scrollTop: 0, scrollLeft: 0 }));

    const scrollBox = (tableContainer?.firstChild as HTMLDivElement | undefined) ?? null;
    useControlledScroll(scrollBox, tabLocalState);

    const columns = useMemo(() => {
      const sortedObjects = objects.slice().sort((a, b) => (b.object?.properties?.length || 0) - (a.object?.properties?.length || 0));
      return sortedObjects[0]?.object?.properties ?? [];
    }, [objects]);

    useExecutor({
      executor: navTreeResource.onItemDelete,
      handlers: [
        function handleNodeDelete(nodeId) {
          tableState.unselect(nodeId);
        },
      ],
    });

    const columnCount = useCreateGridReactiveValue(
      () => columns.length + 1,
      onValueChange => reaction(() => columns.length + 1, onValueChange),
      [columns],
    );
    const rowCount = useCreateGridReactiveValue(
      () => objects.length,
      onValueChange => reaction(() => objects.length, onValueChange),
      [objects],
    );
    const columnCountMemo = useMemo(() => columnCount, [columnCount]);
    const rowCountMemo = useMemo(() => rowCount, [rowCount]);

    const getCell = useCallback(
      (rowIdx: number, colIdx: number) => {
        colIdx--;

        if (colIdx === -1) {
          return <SelectorFormatter object={objects[rowIdx]!} tableState={tableState} />;
        }

        if (colIdx === 0) {
          return <ObjectMenuCell object={objects[rowIdx]!} />;
        }

        const property = objects[rowIdx]?.object?.properties?.[colIdx];
        return property ? getObjectPropertyDisplayValue(property) : '';
      },
      [objects, tableState],
    );

    const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), [
      objects,
      tableState,
    ]);
    const cellMemo = useMemo(() => cell, [cell]);

    const getCellTooltip = useCallback(
      (rowIdx: number, colIdx: number) => {
        colIdx--;
        const property = objects[rowIdx]?.object?.properties?.[colIdx];
        return property ? getObjectPropertyDisplayValue(property) : '';
      },
      [objects],
    );

    const cellTooltip = useCreateGridReactiveValue(
      getCellTooltip,
      (onValueChange, rowIdx, colIdx) => reaction(() => getCellTooltip(rowIdx, colIdx), onValueChange),
      [objects],
    );
    const cellTooltipMemo = useMemo(() => cellTooltip, [cellTooltip]);

    const getHeaderWidth = useCallback((colIdx: number) => {
      if (colIdx === 0) {
        return 40;
      }
      return null;
    }, []);

    const getHeaderText = useCallback(
      (colIdx: number) => {
        colIdx--;
        if (colIdx < 0) {
          return '';
        }
        return columns[colIdx]?.displayName ?? '';
      },
      [columns],
    );

    const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
      columns,
    ]);
    const headerTextMemo = useMemo(() => headerText, [headerText]);

    const getHeaderResizable = useCallback((colIdx: number) => colIdx !== 0, []);
    const getRowHeight = useCallback(() => 40, []);

    if (objects.length === 0) {
      return null;
    }

    return (
      <div ref={setTableContainerRef} className={s(styles, { container: true })}>
        <DataGrid
          className={s(styles, { dataGrid: true })}
          cell={cellMemo}
          cellTooltip={cellTooltipMemo}
          getHeaderWidth={getHeaderWidth}
          getHeaderResizable={getHeaderResizable}
          columnCount={columnCountMemo}
          headerText={headerTextMemo}
          getRowHeight={getRowHeight}
          rowCount={rowCountMemo}
          onScrollToBottom={loadMore}
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
    );
  }),
);
