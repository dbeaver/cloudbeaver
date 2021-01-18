/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import 'react-data-grid/dist/react-data-grid.css';

import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { useCallback, useEffect, useMemo } from 'react';
import DataGrid, { Column } from 'react-data-grid';
import styled from 'reshadow';
import { css } from 'reshadow';

import type { SqlResultSet } from '@cloudbeaver/core-sdk';
import { TextTools } from '@cloudbeaver/core-utils';
import type { IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

import { ResultSetTools } from '../ResultSetTools';

const styles = css`
  DataGrid {
    flex: 1;
  }
`;

interface Props {
  model: IDatabaseDataModel<any>;
  className?: string;
}

function isAtBottom(event: React.UIEvent<HTMLDivElement>): boolean {
  const target = event.target as HTMLDivElement;
  return target.clientHeight + target.scrollTop === target.scrollHeight;
}

const indexColumn: Column<any[], any> = {
  key: Number.MAX_SAFE_INTEGER + '',
  name: '#',
  width: 100,
  resizable: false,
  frozen: true,
  formatter: ({ rowIdx }: any) => <b>{rowIdx + 1}</b>,
};

export const DataGridTable: React.FC<Props> = observer(function DataGridTable({ model }) {
  const handleScroll = useCallback(
    async (event: React.UIEvent<HTMLDivElement>) => {
      if (!isAtBottom(event)) {
        return;
      }

      const result = model?.getResult(0);
      if (result?.loadedFully) {
        return;
      }

      await model.requestDataPortion(0, model.countGain + model.source.count);
    },
    [model]
  );
  const result = model?.getResult(0);

  useEffect(() => {
    if (!result) {
      model
        .setSlice(0, model.countGain + model.source.count)
        .requestData();
    }
  }, [model, result]);

  const { columns, rows } = useMemo(() => computed(() => {
    if (!result) {
      return { columns: [], rows: [] };
    }

    const columnNames = ResultSetTools.getHeaders(result.data as SqlResultSet);
    const rowStrings = ResultSetTools.getLongestCells(result.data as SqlResultSet);

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
    }).map(v => v + 16 + 32);

    // TODO: we need some result type specified formatter to common actions with data
    const rows = (result.data as SqlResultSet).rows || [];
    const columns: Array<Column<any[], any>> = (result.data as SqlResultSet).columns!.map((col, i) => ({
      key: i + '',
      name: col.name!,
      width: Math.min(300, measuredCells[i]),
      resizable: true,
      formatter: ({ row, column }: any) => <b>{JSON.stringify(row[column.key])}</b>,
    }));
    columns.unshift(indexColumn);

    return { rows, columns };
  }), [result]).get();

  return styled(styles)(
    <DataGrid
      columns={columns}
      rows={rows}
      rowHeight={24}
      onScroll={handleScroll}
    />
  );
});
