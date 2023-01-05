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
  useTranslate,
  useStyles
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';


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
    GrantedUsersTableHeader {
      flex: 0 0 auto;
    }
    table-container {
      overflow: auto;
    }
  `;

interface Props {
  grantedUsers: AdminUserInfoFragment[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const GrantedUserList = observer<Props>(function GrantedUserList({
  grantedUsers, disabled, onRevoke, onEdit,
}) {
  const props = useObjectRef({ onRevoke, onEdit });
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  const usersResource = useService(UsersResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const users = getFilteredUsers(grantedUsers, filterState.filterValue);
  const keys = users.map(user => user.userId);

  const revoke = useCallback(() => {
    props.onRevoke(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  let tableInfoText: TLocalizationToken | null = null;
  if (!users.length) {
    if (filterState.filterValue) {
      tableInfoText = 'ui_search_no_result_placeholder';
    } else {
      tableInfoText = 'ui_no_items_placeholder';
    }
  }

  return styled(style)(
    <Group box medium overflow>
      <container>
        <GrantedUsersTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['outlined']} onClick={revoke}>{translate('ui_delete')}</Button>
          <Button disabled={disabled} mod={['unelevated']} onClick={props.onEdit}>{translate('ui_edit')}</Button>
        </GrantedUsersTableHeader>
        <table-container>
          <Table
            keys={keys}
            selectedItems={selectedSubjects}
            isItemSelectable={item => !usersResource.isActiveUser(item)}
          >
            <GrantedUsersTableInnerHeader disabled={disabled} />
            <TableBody>
              {tableInfoText && (
                <TableItem item='tableInfo' selectDisabled>
                  <TableColumnValue colSpan={5}>
                    {translate(tableInfoText)}
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
                    tooltip={activeUser ? translate('administration_teams_team_granted_users_permission_denied') : user.userId}
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
