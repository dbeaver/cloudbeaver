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

import type { RoleInfo } from '@cloudbeaver/core-authentication';
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
  getSelectedItems
} from '@cloudbeaver/core-blocks';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionAccessTableHeader, IFilterState } from './ConnectionAccessTableHeader/ConnectionAccessTableHeader';
import { ConnectionAccessTableInnerHeader } from './ConnectionAccessTableHeader/ConnectionAccessTableInnerHeader';
import { ConnectionAccessTableItem } from './ConnectionAccessTableItem';
import { getFilteredRoles, getFilteredUsers } from './getFilteredSubjects';

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
    ConnectionAccessTableHeader {
      flex: 0 0 auto;
    }
    table-container {
      overflow: auto;
    }
  `;

interface Props {
  grantedUsers: AdminUserInfoFragment[];
  grantedRoles: RoleInfo[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const ConnectionAccessGrantedList = observer<Props>(function ConnectionAccessGrantedList({
  grantedUsers,
  grantedRoles,
  disabled,
  onRevoke,
  onEdit,
}) {
  const props = useObjectRef({ onRevoke, onEdit });
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();
  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const revoke = useCallback(() => {
    props.onRevoke(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  const roles = getFilteredRoles(grantedRoles, filterState.filterValue);
  const users = getFilteredUsers(grantedUsers, filterState.filterValue);
  const keys = roles.map(role => role.roleId).concat(users.map(user => user.userId));

  let tableInfoText: TLocalizationToken = 'connections_connection_access_admin_info';
  if (!keys.length) {
    if (filterState.filterValue) {
      tableInfoText = 'ui_search_no_result_placeholder';
    } else {
      tableInfoText = 'ui_no_items_placeholder';
    }
  }

  return styled(style)(
    <Group box medium overflow>
      <container>
        <ConnectionAccessTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['outlined']} onClick={revoke}>{translate('ui_delete')}</Button>
          <Button disabled={disabled} mod={['unelevated']} onClick={props.onEdit}>{translate('ui_edit')}</Button>
        </ConnectionAccessTableHeader>
        <table-container>
          <Table keys={keys} selectedItems={selectedSubjects}>
            <ConnectionAccessTableInnerHeader disabled={disabled} />
            <TableBody>
              <TableItem item='tableInfo' selectDisabled>
                <TableColumnValue colSpan={5}>
                  {translate(tableInfoText)}
                </TableColumnValue>
              </TableItem>
              {roles.map(role => (
                <ConnectionAccessTableItem
                  key={role.roleId}
                  id={role.roleId}
                  name={role.roleName || ''}
                  tooltip={role.roleName}
                  description={role.description}
                  icon='/icons/role.svg'
                  iconTooltip={translate('authentication_role_icon_tooltip')}
                  disabled={disabled}
                />
              ))}
              {users.map(user => (
                <ConnectionAccessTableItem
                  key={user.userId}
                  id={user.userId}
                  name={user.userId}
                  tooltip={user.userId}
                  icon='/icons/user.svg'
                  iconTooltip={translate('authentication_user_icon_tooltip')}
                  disabled={disabled}
                />
              ))}
            </TableBody>
          </Table>
        </table-container>
      </container>
    </Group>
  );
});
