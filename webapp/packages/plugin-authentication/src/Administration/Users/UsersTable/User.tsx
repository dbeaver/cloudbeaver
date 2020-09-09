/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand
} from '@cloudbeaver/core-blocks';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { UserEdit } from './UserEdit';

const styles = css`
  TableColumnValue[expand] {
    cursor: pointer;
  }
`;

type Props = {
  user: AdminUserInfo;
}

export const User = observer(function User({ user }: Props) {

  return styled(useStyles(styles))(
    <TableItem item={user.userId} expandElement={UserEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue expand>{user.userId}</TableColumnValue>
      <TableColumnValue>{user.grantedRoles.join(', ')}</TableColumnValue>
      <TableColumnValue></TableColumnValue>
    </TableItem>
  );
});
