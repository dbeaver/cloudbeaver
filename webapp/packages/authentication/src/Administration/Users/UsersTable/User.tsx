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
  TableItem, TableColumnValue
} from '@dbeaver/core/blocks';
import { AdminUserInfo } from '@dbeaver/core/sdk';
import { useStyles } from '@dbeaver/core/theming';

type Props = {
  user: AdminUserInfo;
}

export const User = observer(function User({ user }: Props) {
  return styled(useStyles())(
    <TableItem item={user.userId}>
      <TableColumnValue>{user.userId}</TableColumnValue>
      <TableColumnValue>{user.grantedRoles?.join(', ')}</TableColumnValue>
      <TableColumnValue></TableColumnValue>
    </TableItem>
  );
});
