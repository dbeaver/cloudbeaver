/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

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

  const columns = baseObject[0]?.object?.properties ?? [];

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

  function getCell(rowIdx: number, colIdx: number) {
    colIdx--;

    if (colIdx === -1) {
      return <SelectorFormatter object={objects[rowIdx]!} tableState={tableState} />;
    }

    if (colIdx === 0) {
      return <ObjectMenuCell object={objects[rowIdx]!} />;
    }

    const property = objects[rowIdx]?.object?.properties?.[colIdx];
    return property ? getObjectPropertyDisplayValue(property) : '';
  }
  const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), [
    objects,
    tableState,
  ]);

  function getCellTooltip(rowIdx: number, colIdx: number) {
    colIdx--;
    const property = objects[rowIdx]?.object?.properties?.[colIdx];
    return property ? getObjectPropertyDisplayValue(property) : '';
  }

  const cellTooltip = useCreateGridReactiveValue(
    getCellTooltip,
    (onValueChange, rowIdx, colIdx) => reaction(() => getCellTooltip(rowIdx, colIdx), onValueChange),
    [objects],
  );

  function getHeaderWidth(colIdx: number) {
    if (colIdx === 0) {
      return 40;
    }
    return null;
  }

  function getHeaderText(colIdx: number) {
    colIdx--;
    if (colIdx < 0) {
      return '';
    }
    return columns[colIdx]?.displayName ?? '';
  }

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    columns,
  ]);

  function getHeaderResizable(colIdx: number) {
    return colIdx !== 0;
  }

  if (objects.length === 0) {
    return null;
  }

  return (
    <div ref={setTableContainerRef} className={s(styles, { container: true })}>
      <DataGrid
        className={s(styles, { dataGrid: true })}
        cell={cell}
        cellTooltip={cellTooltip}
        getHeaderWidth={getHeaderWidth}
        getHeaderResizable={getHeaderResizable}
        columnCount={columnCount}
        headerText={headerText}
        getRowHeight={() => 40}
        rowCount={rowCount}
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
});
