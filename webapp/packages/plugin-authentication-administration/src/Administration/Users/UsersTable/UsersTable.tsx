/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import {
  Table, TableHeader, BASE_CONTAINERS_STYLES, TableColumnHeader, TableBody, useTranslate } from '@cloudbeaver/core-blocks';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

import { User } from './User';

interface Props {
  keys: string[];
  users: AdminUserInfoFragment[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
  displayAuthRole: boolean;
}

export const UsersTable = observer<Props>(function UsersTable({
  keys,
  users,
  selectedItems,
  expandedItems,
  displayAuthRole,
}) {
  const translate = useTranslate();

  return styled(BASE_CONTAINERS_STYLES)(
    <Table
      keys={keys}
      selectedItems={selectedItems}
      expandedItems={expandedItems}
      size='big'
    >
      <TableHeader fixed>
        {/* {isLocalProviderAvailable && (
                  <TableColumnHeader min flex centerContent>
                    <TableSelect />
                  </TableColumnHeader>
                )} */}
        <TableColumnHeader min />
        <TableColumnHeader>{translate('authentication_user_name')}</TableColumnHeader>
        {displayAuthRole && (
          <TableColumnHeader>{translate('authentication_user_role')}</TableColumnHeader>
        )}
        <TableColumnHeader>{translate('authentication_user_team')}</TableColumnHeader>
        <TableColumnHeader>{translate('authentication_user_enabled')}</TableColumnHeader>
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <User
            key={user.userId}
            user={user}
            displayAuthRole={displayAuthRole}
            // selectable={isLocalProviderAvailable}
          />
        ))}
      </TableBody>
    </Table>
  );
});
