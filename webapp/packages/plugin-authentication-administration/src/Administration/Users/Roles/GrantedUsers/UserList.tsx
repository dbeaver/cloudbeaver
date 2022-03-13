/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  Table,
  TableBody,
  TableItem,
  TableColumnValue,
  BASE_CONTAINERS_STYLES,
  Group,
  Button,
  useObjectRef,
  getComputed,
  getSelectedItems,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { getFilteredUsers } from './getFilteredUsers';
import { GrantedUsersTableHeader, IFilterState } from './GrantedUsersTableHeader/GrantedUsersTableHeader';
import { GrantedUsersTableInnerHeader } from './GrantedUsersTableHeader/GrantedUsersTableInnerHeader';
import { GrantedUsersTableItem } from './GrantedUsersTableItem';

const styles = css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    Group {
      position: relative;
    }
    Group, container, table-container {
      height: 100%;
    }
    container {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    table-container {
      overflow: auto;
    }
    GrantedUsersTableHeader {
      flex: 0 0 auto;
    }
  `;

interface Props {
  userList: AdminUserInfoFragment[];
  grantedUsers: string[];
  disabled: boolean;
  onGrant: (subjectIds: string[]) => void;
}

export const UserList = observer<Props>(function UserList({
  userList,
  grantedUsers,
  disabled,
  onGrant,
}) {
  const props = useObjectRef({ onGrant });
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  const usersResource = useService(UsersResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const users = getFilteredUsers(userList, filterState.filterValue);
  const keys = users.map(user => user.userId);

  const grant = useCallback(() => {
    props.onGrant(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  return styled(style)(
    <Group box medium overflow>
      <container>
        <GrantedUsersTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['unelevated']} onClick={grant}>{translate('ui_add')}</Button>
        </GrantedUsersTableHeader>
        <table-container>
          <Table
            keys={keys}
            selectedItems={selectedSubjects}
            isItemSelectable={item => !(usersResource.isActiveUser(item) || grantedUsers.includes(item))}
          >
            <GrantedUsersTableInnerHeader disabled={disabled} />
            <TableBody>
              {!users.length && filterState.filterValue && (
                <TableItem item='tableInfo' selectDisabled>
                  <TableColumnValue colSpan={5}>
                    {translate('ui_search_no_result_placeholder')}
                  </TableColumnValue>
                </TableItem>
              )}
              {users.map(user => {
                const activeUser = usersResource.isActiveUser(user.userId);
                return (
                  <GrantedUsersTableItem
                    key={user.userId}
                    id={user.userId}
                    name={`${user.userId}${activeUser ? ' (you)' : ''}`}
                    tooltip={activeUser ? translate('administration_roles_role_granted_users_permission_denied') : user.userId}
                    icon='/icons/user.svg'
                    iconTooltip={translate('authentication_user_icon_tooltip')}
                    disabled={disabled}
                  />
                );
              })}
            </TableBody>
          </Table>
        </table-container>
      </container>
    </Group>
  );
});
