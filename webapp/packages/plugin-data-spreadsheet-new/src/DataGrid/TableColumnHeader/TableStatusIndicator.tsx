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

import { IconOrImage, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { DatabaseDataFeature, isResultSetDataSource } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContext } from '../DataGridContext.js';
import { TableDataContext } from '../TableDataContext.js';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import styles from './TableStatusIndicator.module.css';

export const TableStatusIndicator = observer(function TableStatusIndicator() {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const translate = useTranslate();

  const source = dataGridContext.model.source;
  const resultSetSource = isResultSetDataSource(source) ? source : null;

  /* We do NOT use `model.isReadonly()` here —
  that method aggregates several unrelated reasons
  and loses information about WHY editing isn't allowed. */
  const contextInfo = resultSetSource?.executionContext?.context;
  const connectionKey = contextInfo ? createConnectionParam(contextInfo.projectId, contextInfo.connectionId) : null;
  const connectionInfoLoader = useResource(TableStatusIndicator, ConnectionInfoResource, connectionKey);
  const readOnlyConnection = connectionInfoLoader.data?.readOnly ?? false;

  const readOnlyPresentation = source.hasFeature(DatabaseDataFeature.Grouping);

  const style = useS(styles);

  if (!tableDataContext || !dataGridContext) {
    return null;
  }

  const rowIdentifierInfo = resultSetSource?.getRowIdentifierInfo(dataGridContext.resultIndex);
  const hasRowIdentifier = resultSetSource?.hasElementIdentifier(dataGridContext.resultIndex);

  const firstColumn = tableDataContext.columns[1];
  const firstColumnData = isNotNullDefined(firstColumn?.key)
    ? (tableDataContext.data.getColumn(firstColumn.key) as SqlResultColumn | undefined)
    : undefined;
  const readOnlyStatus = firstColumnData?.readOnlyStatus;

  const isVirtualKey = rowIdentifierInfo?.state === SqlRowIdentifierState.VirtualKey;
  const isPrimaryKey = rowIdentifierInfo?.state === SqlRowIdentifierState.PrimaryKey;
  const tooltipParts: string[] = [];

  // Presentation-level read-only takes precedence over connection-level read-only.
  if (readOnlyPresentation) {
    tooltipParts.push(translate('data_grid_table_readonly_presentation_tooltip'));
  } else if (readOnlyConnection) {
    tooltipParts.push(translate('data_grid_table_readonly_connection_tooltip'));
  }

  if (readOnlyStatus) {
    tooltipParts.push(readOnlyStatus);
  }

  if (hasRowIdentifier && rowIdentifierInfo?.identifier) {
    const constraintType = rowIdentifierInfo.identifier.constraintType;
    const attributeNames = rowIdentifierInfo.identifier.attributes.map(attr => attr.name).join(', ');
    tooltipParts.push(`${constraintType}: ${attributeNames}`);
  } else if (isVirtualKey) {
    tooltipParts.push(translate('data_grid_table_virtual_key_tooltip'));
  }

  const showLockIcon = readOnlyConnection || readOnlyPresentation;

  // Hide the entire indicator when there's nothing meaningful to display (Session Manager)
  const hasInfo = showLockIcon || !!readOnlyStatus || hasRowIdentifier || isVirtualKey || isPrimaryKey;

  if (!hasInfo) {
    return null;
  }

  const tooltip = tooltipParts.join('\n');

  return (
    <div
      title={tooltip}
      className="tw:absolute tw:top-1/2 tw:left-1 tw:-translate-y-1/2 tw:z-1 tw:pointer-events-auto tw:flex tw:items-center tw:gap-1 tw:cursor-help"
    >
      {showLockIcon && <IconOrImage icon="/icons/lock.png" className="tw:w-2.5 tw:cursor-help" />}
      <div
        className={s(
          style,
          { indicator: true },
          isPrimaryKey && style['primaryKey'],
          isVirtualKey && style['virtualKey'],
          !isPrimaryKey && !isVirtualKey && style['defaultStatus'],
        )}
      />
    </div>
  );
});
