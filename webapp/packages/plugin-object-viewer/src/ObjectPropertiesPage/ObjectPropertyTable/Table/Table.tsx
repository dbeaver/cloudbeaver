/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { IScrollState, Translate, useControlledScroll, useStyles, useTable } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type DBObject, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useTabLocalState } from '@cloudbeaver/core-ui';
import { isDefined, TextTools } from '@cloudbeaver/core-utils';
import DataGrid from '@cloudbeaver/plugin-react-data-grid';

import { getValue } from '../../helpers';
import { ObjectPropertyTableFooter } from '../ObjectPropertyTableFooter';
import { CellFormatter } from './CellFormatter';
import type { IDataColumn } from './Column';
import { ColumnIcon } from './Columns/ColumnIcon/ColumnIcon';
import { ColumnSelect } from './Columns/ColumnSelect/ColumnSelect';
import { HeaderRenderer } from './HeaderRenderer';
import baseStyles from './styles/base.scss';
import { tableStyles } from './styles/styles';
import { TableContext } from './TableContext';
import { useTableData } from './useTableData';

const style = css`
  wrapper {
    composes: theme-typography--body2 from global;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  DataGrid {
    width: 100%;
    height: 100%;
  }
  data-info {
    padding: 4px 12px;
  }
  ObjectPropertyTableFooter {
    composes: theme-background-secondary theme-text-on-secondary theme-border-color-background from global;
    border-top: 1px solid;
  }
`;

const CELL_FONT = '400 12px Roboto';
const COLUMN_FONT = '700 12px Roboto';
const CELL_PADDING = 16;
const CELL_BORDER = 2;

interface Props {
  objects: DBObject[];
  truncated?: boolean;
}

function getMeasuredCells(columns: ObjectPropertyInfo[], rows: DBObject[]) {
  const columnNames = columns.map(column => column.displayName?.toUpperCase()).filter(isDefined);
  const rowStrings: string[] = Array(columns.length).fill('');

  for (const row of rows.slice(0, 100)) {
    if (row.object?.properties) {
      for (let i = 0; i < row.object.properties.length; i++) {
        const value = getValue(row.object.properties[i].value);

        if (value.length > rowStrings[i].length) {
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

  const widthData = columnNames.map((_, i) => Math.max(columnsWidth[i], cellsWidth[i] ?? 0));

  return widthData;
}

const CUSTOM_COLUMNS = [ColumnSelect, ColumnIcon];

export const Table = observer<Props>(function Table({ objects, truncated }) {
  const [tableContainer, setTableContainerRef] = useState<HTMLDivElement | null>(null);
  const navTreeResource = useService(NavTreeResource);
  const styles = useStyles(style, baseStyles, tableStyles);
  const tableState = useTable();
  const tabLocalState = useTabLocalState<IScrollState>(() => ({ scrollTop: 0, scrollLeft: 0 }));

  const scrollBox = (tableContainer?.firstChild as HTMLDivElement | undefined) ?? null;
  useControlledScroll(scrollBox, tabLocalState);

  const baseObject = objects.slice().sort((a, b) => (b.object?.properties?.length || 0) - (a.object?.properties?.length || 0));

  const nodeIds = objects.map(object => object.id);
  const properties = baseObject[0]?.object?.properties ?? [];
  const measuredCells = getMeasuredCells(properties, objects);

  const dataColumns: IDataColumn[] = properties.map((property, index) => ({
    key: property.id!,
    name: property.displayName ?? '',
    description: property.description,
    columnDataIndex: null,
    width: Math.min(300, measuredCells[index]),
    minWidth: 40,
    resizable: true,
    formatter: CellFormatter,
    headerRenderer: HeaderRenderer,
  }));

  const tableData = useTableData(dataColumns, CUSTOM_COLUMNS);

  if (objects.length === 0) {
    return null;
  }

  return styled(styles)(
    <TableContext.Provider value={{ tableData, tableState }}>
      <wrapper ref={setTableContainerRef} className="metadata-grid-container">
        <DataGrid className="cb-metadata-grid-theme" rows={objects} rowKeyGetter={row => row.id} columns={tableData.columns} rowHeight={32} />
        {truncated && (
          <data-info>
            <Translate token="app_navigationTree_limited" limit={navTreeResource.childrenLimit} />
          </data-info>
        )}
        <ObjectPropertyTableFooter nodeIds={nodeIds} tableState={tableState} />
      </wrapper>
    </TableContext.Provider>,
  );
});
