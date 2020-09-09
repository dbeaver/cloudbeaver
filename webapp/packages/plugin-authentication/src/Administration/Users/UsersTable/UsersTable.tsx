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
  Table, TableHeader, TableColumnHeader, TableBody
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { User } from './User';

const styles = css`
  Table {
    width: 100%;
  }
  TableColumnHeader {
    border-top: solid 1px;
  }
`;

type Props = {
  users: AdminUserInfo[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
}

export const UsersTable = observer(function UsersTable({ users, selectedItems, expandedItems }: Props) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <Table selectedItems={selectedItems} expandedItems={expandedItems} {...use({ size: 'big' })}>
      <TableHeader>
        <TableColumnHeader min/>
        <TableColumnHeader min/>
        <TableColumnHeader>{translate('authentication_user_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('authentication_user_role')}</TableColumnHeader>
        <TableColumnHeader></TableColumnHeader>
      </TableHeader>
      <TableBody>
        {users.map(user => <User key={user.userId} user={user}/>)}
      </TableBody>
    </Table>
  );
});
