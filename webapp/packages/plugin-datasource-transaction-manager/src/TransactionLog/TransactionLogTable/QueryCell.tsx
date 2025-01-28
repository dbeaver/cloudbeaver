/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import type { TransactionLogInfoItem } from '@cloudbeaver/core-sdk';
import { type RenderCellProps } from '@cloudbeaver/plugin-data-grid';

import classes from './QueryCell.module.css';
import { QueryDetailsDialog } from './QueryDetailsDialog.js';

export const QueryCell = observer<RenderCellProps<TransactionLogInfoItem>>(function QueryCell(props) {
  const commonDialogService = useService(CommonDialogService);
  const value = props.row.queryString;

  async function openDetails() {
    await commonDialogService.open(QueryDetailsDialog, {
      text: value,
    });
  }

  return (
    <div title={value} className={classes['cell']} onDoubleClick={openDetails}>
      {value}
    </div>
  );
});
