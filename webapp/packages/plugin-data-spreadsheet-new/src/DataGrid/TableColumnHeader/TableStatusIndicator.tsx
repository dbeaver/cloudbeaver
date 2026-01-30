/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { SqlRowIdentifierState, type SqlResultColumn } from '@cloudbeaver/core-sdk';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { clsx } from '@dbeaver/ui-kit';

import { IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';

import { DataGridContext } from '../DataGridContext.js';
import { TableDataContext } from '../TableDataContext.js';
import { isNotNullDefined } from '@dbeaver/js-helpers/isNotNullDefined';

export const TableStatusIndicator = observer(function TableStatusIndicator() {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const readOnlyConnection = dataGridContext.model.isReadonly(dataGridContext.resultIndex);
  const translate = useTranslate();

  if (!tableDataContext || !dataGridContext) {
    return null;
  }

  const rowIdentifierInfo = dataGridContext.model.getRowIdentifierInfo(dataGridContext.resultIndex);
  const hasRowIdentifier = dataGridContext.model.hasElementIdentifier(dataGridContext.resultIndex);

  const firstColumn = tableDataContext.columns[1];
  const firstColumnData = isNotNullDefined(firstColumn?.key)
    ? (tableDataContext.data.getColumn(firstColumn.key) as SqlResultColumn | undefined)
    : undefined;
  const readOnlyStatus = firstColumnData?.readOnlyStatus;

  const isVirtualKey = rowIdentifierInfo.state === SqlRowIdentifierState.VirtualKey;
  const isPrimaryKey = rowIdentifierInfo.state === SqlRowIdentifierState.PrimaryKey;
  const tooltipParts: string[] = [];

  if (readOnlyConnection) {
    tooltipParts.push(translate('data_grid_table_readonly_connection_tooltip'));
  }

  if (readOnlyStatus) {
    if (!readOnlyConnection) {
      tooltipParts.push(translate('data_grid_table_readonly_tooltip'));
    }
    tooltipParts.push(readOnlyStatus);
  }

  if (hasRowIdentifier && rowIdentifierInfo.identifier) {
    const constraintType = rowIdentifierInfo.identifier.constraintType;
    const attributeNames = rowIdentifierInfo.identifier.attributes.map(attr => attr.name).join(', ');
    tooltipParts.push(`${constraintType}: ${attributeNames}`);
  } else if (isVirtualKey) {
    tooltipParts.push(translate('data_grid_table_virtual_key_tooltip'));
  }

  const tooltip = tooltipParts.join('\n');

  return (
    <div
      title={tooltip}
      className="tw:absolute tw:top-1/2 tw:left-1 tw:-translate-y-1/2 tw:z-1 tw:pointer-events-auto tw:flex tw:items-center tw:gap-1 tw:cursor-help"
    >
      {readOnlyConnection && <IconOrImage icon="/icons/lock.png" className="tw:w-2.5 tw:cursor-help" />}
      <div
        className={clsx(
          'tw:w-3 tw:h-3 tw:rounded-full tw:shrink-0 tw:bg-transparent tw:border',
          "tw:before:content-[''] tw:before:block tw:before:w-1.5 tw:before:h-1.5 tw:before:rounded-full tw:before:m-0.5",
          isPrimaryKey && 'tw:border-[var(--theme-positive)] tw:before:bg-[var(--theme-positive)]',
          isVirtualKey && 'tw:border-[var(--theme-link-color)] tw:before:bg-[var(--theme-link-color)]',
          !isPrimaryKey && !isVirtualKey && 'tw:border-[var(--theme-status)] tw:before:bg-[var(--theme-status)]',
        )}
      />
    </div>
  );
});
