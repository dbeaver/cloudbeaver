/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { clsx } from '@dbeaver/ui-kit';

import { IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';

import { DataGridContext } from '../DataGridContext.js';
import { TableDataContext } from '../TableDataContext.js';

interface Props {
  readonly: boolean;
}

export const TableStatusIndicator = observer<Props>(function TableStatusIndicator({ readonly }) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const translate = useTranslate();

  if (!tableDataContext || !dataGridContext) {
    return null;
  }

  const hasRowIdentifier = dataGridContext.model.hasElementIdentifier(dataGridContext.resultIndex);

  const firstColumn = tableDataContext.columns[1];
  const firstColumnData =
    firstColumn?.key !== null && firstColumn?.key !== undefined
      ? (tableDataContext.data.getColumn(firstColumn.key) as SqlResultColumn | undefined)
      : undefined;
  const readOnlyStatus = firstColumnData?.readOnlyStatus;

  // TODO: Detect virtual keys when backend provides the information
  const isVirtualKey = false;
  let tooltip: string = '';

  if (readonly) {
    tooltip = translate('data_grid_table_readonly_tooltip');
    if (readOnlyStatus) {
      tooltip += ': ' + readOnlyStatus;
    }
  }

  if (hasRowIdentifier) {
    // TEMPORARY: Detect primary key by checking for required and not read-only columns
    // TODO: Remove when backend provides the information
    const pkColumn = tableDataContext.columns.find(col => {
      const colData = col.key && (tableDataContext.data.getColumn(col.key) as SqlResultColumn | undefined);
      return colData?.required && !colData?.readOnly;
    })?.key;

    if (pkColumn) {
      tooltip = `Unique key: ${(tableDataContext.data.getColumn(pkColumn) as SqlResultColumn | undefined)?.name}`;
    }
  } else {
    tooltip = translate('data_grid_table_no_key_found_tooltip');
  }

  return (
    <div
      title={tooltip}
      className="tw:absolute tw:top-1/2 tw:left-1 tw:-translate-y-1/2 tw:z-[1] tw:pointer-events-auto tw:flex tw:items-center tw:gap-1 tw:cursor-help"
    >
      {readonly && <IconOrImage icon="/icons/lock.png" className="tw:w-2.5 tw:cursor-help" />}
      <div
        className={clsx(
          'tw:w-3 tw:h-3 tw:rounded-full tw:flex-shrink-0',
          'tw:bg-transparent tw:border-1',
          "tw:before:content-[''] tw:before:block tw:before:w-1.5 tw:before:h-1.5 tw:before:rounded-full tw:before:m-0.5",
          !hasRowIdentifier && 'tw:border-(--theme-status) tw:before:bg-(--theme-status)',
          hasRowIdentifier && !isVirtualKey && 'tw:border-(--theme-positive) tw:before:bg-(--theme-positive)',
          isVirtualKey && 'tw:border-(--theme-info) tw:before:bg-(--theme-info)',
        )}
      />
    </div>
  );
});
