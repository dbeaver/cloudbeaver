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
import { useTranslate } from '@dbeaver/core/localization';
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
  selectedItems: Map<string, boolean>;
}

export const UsersTable = observer(function UsersTable({ users, selectedItems }: Props) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <Table selectedItems={selectedItems}>
      <TableHeader>
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
