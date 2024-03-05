/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  Button,
  getComputed,
  getSelectedItems,
  Group,
  s,
  Table,
  TableBody,
  TableColumnValue,
  TableItem,
  useObjectRef,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

import { getFilteredUsers } from './getFilteredUsers';
import { GrantedUsersTableHeader, IFilterState } from './GrantedUsersTableHeader/GrantedUsersTableHeader';
import { GrantedUsersTableInnerHeader } from './GrantedUsersTableHeader/GrantedUsersTableInnerHeader';
import { GrantedUsersTableItem } from './GrantedUsersTableItem';
import style from './UserList.m.css';

interface Props {
  userList: AdminUserInfoFragment[];
  grantedUsers: string[];
  disabled: boolean;
  onGrant: (subjectIds: string[]) => void;
}

export const UserList = observer<Props>(function UserList({ userList, grantedUsers, disabled, onGrant }) {
  const props = useObjectRef({ onGrant });
  const styles = useS(style);
  const translate = useTranslate();

  const usersResource = useService(UsersResource);
  const serverConfigResource = useService(ServerConfigResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const users = getFilteredUsers(userList, filterState.filterValue);
  const keys = users.map(user => user.userId);

  const grant = useCallback(() => {
    props.onGrant(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  function isEditable(userId: string) {
    if (serverConfigResource.distributed) {
      return true;
    }

    return !usersResource.isActiveUser(userId);
  }

  return (
    <Group className={s(styles, { box: true })} box medium overflow>
      <div className={s(styles, { innerBox: true })}>
        <GrantedUsersTableHeader className={s(styles, { header: true })} filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['unelevated']} onClick={grant}>
            {translate('ui_add')}
          </Button>
        </GrantedUsersTableHeader>
        <div className={s(styles, { tableBox: true })}>
          <Table
            className={s(styles, { table: true })}
            keys={keys}
            selectedItems={selectedSubjects}
            isItemSelectable={item => isEditable(item) && !grantedUsers.includes(item)}
          >
            <GrantedUsersTableInnerHeader disabled={disabled} />
            <TableBody>
              {!users.length && filterState.filterValue && (
                <TableItem item="tableInfo" selectDisabled>
                  <TableColumnValue colSpan={5}>{translate('ui_search_no_result_placeholder')}</TableColumnValue>
                </TableItem>
              )}
              {users.map(user => (
                <GrantedUsersTableItem
                  key={user.userId}
                  id={user.userId}
                  name={`${user.userId}${usersResource.isActiveUser(user.userId) ? ` (${translate('ui_you')})` : ''}`}
                  tooltip={isEditable(user.userId) ? user.userId : translate('administration_teams_team_granted_users_permission_denied')}
                  icon="/icons/user.svg"
                  iconTooltip={translate('authentication_user_icon_tooltip')}
                  disabled={disabled}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Group>
  );
});
