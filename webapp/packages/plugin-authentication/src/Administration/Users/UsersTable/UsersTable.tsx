/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import type { AdminUser } from '@cloudbeaver/core-authentication';
import {
  Table, TableHeader, TableColumnHeader, TableBody
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { User } from './User';

const styles = css`
  Table {
    width: 100%;
  }
`;

interface Props {
  users: AdminUser[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
  selectable?: boolean;
}

export const UsersTable = observer(function UsersTable({ users, selectedItems, expandedItems, selectable }: Props) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <Table selectedItems={selectedItems} expandedItems={expandedItems} {...use({ size: 'big' })}>
      <TableHeader>
        {selectable && <TableColumnHeader min />}
        <TableColumnHeader min />
        <TableColumnHeader>{translate('authentication_user_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('authentication_user_role')}</TableColumnHeader>
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {users.map(user => <User key={user.userId} user={user} selectable={selectable} />)}
      </TableBody>
    </Table>
  );
});
