/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  Loader,
  Table,
  TableBody,
  TableColumnHeader,
  TableColumnValue,
  TableHeader,
  TableItem,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

import { User } from './User';

interface Props {
  users: AdminUserInfoFragment[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
  displayAuthRole: boolean;
  loading?: boolean;
  hasMore: boolean;
  onLoadMore?: () => void;
}

export const UsersTable = observer<Props>(function UsersTable({
  users,
  selectedItems,
  expandedItems,
  displayAuthRole,
  loading,
  hasMore,
  onLoadMore,
}) {
  const translate = useTranslate();
  const keys = users.map(user => user.userId);
  const colSpan = displayAuthRole ? 6 : 5;

  return (
    <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size="big">
      <TableHeader fixed>
        <TableColumnHeader min>
          <Loader loading={loading} small />
        </TableColumnHeader>
        <TableColumnHeader>{translate('authentication_user_name')}</TableColumnHeader>
        {displayAuthRole && <TableColumnHeader>{translate('authentication_user_role')}</TableColumnHeader>}
        <TableColumnHeader>{translate('authentication_user_team')}</TableColumnHeader>
        <TableColumnHeader>{translate('authentication_user_enabled')}</TableColumnHeader>
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <User key={user.userId} user={user} displayAuthRole={displayAuthRole} />
        ))}
        {(loading || users.length === 0) && (
          <TableItem item="load-more">
            <TableColumnValue colSpan={colSpan} centerContent flex>
              {translate(loading ? 'ui_processing_loading' : 'authentication_administration_users_empty')}
            </TableColumnValue>
          </TableItem>
        )}
        {hasMore && (
          <TableItem item="load-more">
            <TableColumnValue colSpan={colSpan} centerContent flex>
              <Button type="button" mod={['outlined']} loading={loading} loader onClick={onLoadMore}>
                {translate('ui_load_more')}
              </Button>
            </TableColumnValue>
          </TableItem>
        )}
      </TableBody>
    </Table>
  );
});
