/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';
import type { TransactionLogInfoItem } from '@cloudbeaver/core-sdk';
import { type Column, DataGrid } from '@cloudbeaver/plugin-data-grid';

import { HeaderCell } from './HeaderCell.js';
import { QueryCell } from './QueryCell.js';
import { TimeCell } from './TimeCell.js';
import classes from './TransactionLogTable.module.css';

interface Props {
  log: TransactionLogInfoItem[];
}

const QUERY_COLUMN_WIDTH = 300;

const COLUMNS: Column<TransactionLogInfoItem>[] = [
  {
    key: 'time',
    name: 'plugin_datasource_transaction_manager_logs_table_column_time',
    resizable: true,
    renderCell: props => <TimeCell {...props} />,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'type',
    name: 'plugin_datasource_transaction_manager_logs_table_column_type',
    resizable: true,
    renderCell: props => <div>{props.row.type}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'text',
    name: 'plugin_datasource_transaction_manager_logs_table_column_text',
    resizable: true,
    width: QUERY_COLUMN_WIDTH,
    renderCell: props => <QueryCell {...props} />,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'duration',
    name: 'plugin_datasource_transaction_manager_logs_table_column_duration',
    resizable: true,
    renderCell: props => <div>{props.row.durationMs}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'rows',
    name: 'plugin_datasource_transaction_manager_logs_table_column_rows',
    resizable: true,
    renderCell: props => <div>{props.row.rows}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'result',
    name: 'plugin_datasource_transaction_manager_logs_table_column_result',
    resizable: true,
    renderCell: props => <div>{props.row.result}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
];

export const TransactionLogTable = observer<Props>(function TransactionLogTable(props) {
  const styles = useS(classes);

  return (
    <div className={s(styles, { container: true })}>
      <DataGrid
        rows={props.log}
        rowKeyGetter={
          // @ts-ignore
          row => row.id
        }
        columns={COLUMNS}
        rowHeight={30}
      />
    </div>
  );
});
