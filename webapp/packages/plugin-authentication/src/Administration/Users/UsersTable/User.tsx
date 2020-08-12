/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { UsersResource } from '../../UsersResource';
import { UserEdit } from './UserEdit';

const styles = composes(
  css`
    TableColumnValue {
      composes: theme-border-color-color-positive from global;
    }
  `,
  css`
    [|new] {
      border-left: solid 3px;
    }
  `
);

type Props = {
  user: AdminUserInfo;
}

export const User = observer(function User({ user }: Props) {
  const usersResource = useService(UsersResource);
  const isNew = usersResource.isNew(user.userId);

  return styled(useStyles(styles))(
    <TableItem item={user.userId} expandElement={UserEdit}>
      <TableColumnValue centerContent flex {...use({ new: isNew })}>
        <TableItemSelect />
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue>{user.userId}</TableColumnValue>
      <TableColumnValue>{user.grantedRoles.join(', ')}</TableColumnValue>
      <TableColumnValue></TableColumnValue>
    </TableItem>
  );
});
