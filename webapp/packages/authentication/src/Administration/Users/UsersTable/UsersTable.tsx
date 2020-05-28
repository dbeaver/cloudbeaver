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
  Table, TableHeader, TableColumnHeader, TableBody
} from '@dbeaver/core/blocks';
import { AdminUserInfo } from '@dbeaver/core/sdk';
import { useStyles, composes } from '@dbeaver/core/theming';

import { User } from './User';

const styles = composes(
  css``,
  css`
    TableColumnHeader {
      border-top: solid 1px;
    }
  `
);

type Props = {
  users: AdminUserInfo[];
}

export const UsersTable = observer(function UsersTable({ users }: Props) {
  return styled(useStyles(styles))(
    <Table>
      <TableHeader>
        <TableColumnHeader>User login</TableColumnHeader>
        <TableColumnHeader></TableColumnHeader>
      </TableHeader>
      <TableBody>
        {users.map(user => <User key={user.userId} user={user}/>)}
      </TableBody>
    </Table>
  );
});
