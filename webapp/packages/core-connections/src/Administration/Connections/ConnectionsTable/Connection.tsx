/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import {
  TableItem, TableColumnValue, TableItemSelect
} from '@cloudbeaver/core-blocks';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

type Props = {
  connection: ConnectionInfo;
}

export const Connection = observer(function Connection({ connection }: Props) {
  return styled(useStyles())(
    <TableItem item={connection.id}>
      <TableColumnValue centerContent><TableItemSelect /></TableColumnValue>
      <TableColumnValue>{connection.name}</TableColumnValue>
      <TableColumnValue>{connection.host}</TableColumnValue>
      <TableColumnValue>{connection.port}</TableColumnValue>
      <TableColumnValue><input type="checkbox" checked={!connection.template} disabled/></TableColumnValue>
      <TableColumnValue></TableColumnValue>
    </TableItem>
  );
});
