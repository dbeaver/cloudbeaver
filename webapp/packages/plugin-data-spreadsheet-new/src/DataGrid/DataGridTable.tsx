/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo } from 'react';
import DataGrid from 'react-data-grid';
import type { Column } from 'react-data-grid';
import styled from 'reshadow';

import type { SqlResultSet } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { TextTools } from '@cloudbeaver/core-utils';
import type { IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

import { ResultSetTools } from '../ResultSetTools';
import baseStyles from '../styles/base.scss';
import { reactGridStyles } from '../styles/styles';
import { DataGridContext } from './DataGridContext';
import { DataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';
import { useGridSelectionContext } from './DataGridSelection/useGridSelectionContext';
import { DataGridSortingContext } from './DataGridSorting/DataGridSortingContext';
import { useGridSortingContext } from './DataGridSorting/useGridSortingContext';
import { DataGridTableContainer } from './DataGridTableContainer';
import { CellFormatter } from './Formatters/CellFormatter';
import { IndexFormatter } from './Formatters/IndexFormatter';
import { RowRenderer } from './RowRenderer/RowRenderer';
import { TableColumnHeaderNew } from './TableColumnHeader/TableColumnHeader-new';

interface Props {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
  className?: string;
}

function isAtBottom(event: React.UIEvent<HTMLDivElement>): boolean {
  const target = event.target as HTMLDivElement;
  return target.clientHeight + target.scrollTop === target.scrollHeight;
}

const indexColumn: Column<any[], any> = {
  key: Number.MAX_SAFE_INTEGER + '',
  name: '#',
  minWidth: 60,
  width: 60,
  resizable: false,
  frozen: true,
  formatter: IndexFormatter,
};

export const DataGridTable: React.FC<Props> = observer(function DataGridTable({ model, resultIndex, className }) {
  const styles = useStyles(reactGridStyles, baseStyles);

  const modelResultData = model?.getResult(resultIndex);

  const gridSortingContext = useGridSortingContext(model);
  const gridSelectionContext = useGridSelectionContext(modelResultData, { indexColumnKey: indexColumn.key });

  const handleScroll = useCallback(
    async (event: React.UIEvent<HTMLDivElement>) => {
      if (!isAtBottom(event)) {
        return;
      }

      const result = model?.getResult(resultIndex);
      if (result?.loadedFully) {
        return;
      }

      await model.requestDataPortion(0, model.countGain + model.source.count);
    },
    [model, resultIndex]
  );

  useEffect(() => {
    if (!modelResultData) {
      model
        .setSlice(0, model.countGain + model.source.count)
        .requestData();
    }
  }, [model, modelResultData]);

  const { columns, rows } = useMemo(() => computed(() => {
    if (!modelResultData) {
      return { columns: [], rows: [] };
    }

    const columnNames = ResultSetTools.getHeaders(modelResultData.data as SqlResultSet);
    const rowStrings = ResultSetTools.getLongestCells(modelResultData.data as SqlResultSet);

    // TODO: seems better to do not measure container size
    //       for detecting max columns size, better to use configurable variable
    const measuredCells = TextTools.getWidth({
      font: '400 14px Roboto',
      text: columnNames.map((cell, i) => {
        if (cell.length > (rowStrings[i] || '').length) {
          return cell;
        }
        return rowStrings[i];
      }),
    }).map(v => v + 16 + 32 + 20);

    // TODO: we need some result type specified formatter to common actions with data
    const rows = (modelResultData.data as SqlResultSet).rows || [];

    const columns: Array<Column<any[], any>> = (modelResultData.data as SqlResultSet).columns!.map((col, i) => ({
      key: i + '',
      name: col.label!,
      width: Math.min(300, measuredCells[i]),
      minWidth: 40,
      resizable: true,
      headerRenderer: TableColumnHeaderNew,
      formatter: CellFormatter,
    }));
    columns.unshift(indexColumn);

    return { rows, columns };
  }), [modelResultData]).get();

  return styled(styles)(
    <DataGridContext.Provider value={{ model, resultIndex }}>
      <DataGridSortingContext.Provider value={gridSortingContext}>
        <DataGridSelectionContext.Provider value={gridSelectionContext}>
          <DataGridTableContainer modelResultData={modelResultData}>
            <DataGrid
              className={`cb-react-grid-theme ${className}`}
              columns={columns}
              rows={rows}
              headerRowHeight={28}
              rowHeight={24}
              rowRenderer={RowRenderer}
              onScroll={handleScroll}
            />
          </DataGridTableContainer>
        </DataGridSelectionContext.Provider>
      </DataGridSortingContext.Provider>
    </DataGridContext.Provider>
  );
});
