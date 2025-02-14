/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { TransactionLogInfoItem } from '@cloudbeaver/core-sdk';
import { DataGrid } from '@cloudbeaver/plugin-data-grid';

import { QueryCell } from './QueryCell.js';
import { TimeCell } from './TimeCell.js';
import classes from './TransactionLogTable.module.css';

interface Props {
  log: TransactionLogInfoItem[];
}

const QUERY_COLUMN_WIDTH = 250;

export const TransactionLogTable = observer<Props>(function TransactionLogTable({ log }) {
  const styles = useS(classes);
  const translate = useTranslate();

  function getCell(rowIdx: number, colIdx: number) {
    switch (colIdx) {
      case 0:
        return <TimeCell row={log[rowIdx]!} />;
      case 1:
        return log![rowIdx]?.type ?? '';
      case 2:
        return <QueryCell row={log[rowIdx]!} />;
      case 3:
        return String(log![rowIdx]?.durationMs ?? '');
      case 4:
        return String(log![rowIdx]?.rows ?? '');
      case 5:
        return log![rowIdx]?.result ?? '';
    }

    return '';
  }

  function getHeaderText(colIdx: number) {
    switch (colIdx) {
      case 0:
        return translate('plugin_datasource_transaction_manager_logs_table_column_time');
      case 1:
        return translate('plugin_datasource_transaction_manager_logs_table_column_type');
      case 2:
        return translate('plugin_datasource_transaction_manager_logs_table_column_text');
      case 3:
        return translate('plugin_datasource_transaction_manager_logs_table_column_duration');
      case 4:
        return translate('plugin_datasource_transaction_manager_logs_table_column_rows');
      case 5:
        return translate('plugin_datasource_transaction_manager_logs_table_column_result');
    }

    return '';
  }

  function getHeaderWidth(colIdx: number) {
    switch (colIdx) {
      case 2:
        return QUERY_COLUMN_WIDTH;
      default:
        return 'auto';
    }
  }

  return (
    <div className={s(styles, { container: true })}>
      <DataGrid
        getCell={getCell}
        getHeaderWidth={getHeaderWidth}
        getColumnCount={() => 6}
        getHeaderText={getHeaderText}
        getRowHeight={() => 30}
        getRowCount={() => log.length}
      />
    </div>
  );
});
