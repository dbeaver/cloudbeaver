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
import { Link } from '@cloudbeaver/core-blocks';

import { QueryDetailsDialog } from './QueryDetailsDialog.js';

interface Props {
  row: TransactionLogInfoItem;
}

export const QueryCell = observer<Props>(function QueryCell({ row }) {
  const commonDialogService = useService(CommonDialogService);
  const value = row.queryString;

  async function openDetails() {
    await commonDialogService.open(QueryDetailsDialog, {
      text: value,
    });
  }

  return (
    <Link title={value} inline onClick={openDetails}>
      {value}
    </Link>
  );
});
