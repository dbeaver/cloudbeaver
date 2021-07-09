/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'reshadow';

import {
  Table,
  TableBody,
  TableItem,
  TableColumnValue,
  BASE_CONTAINERS_STYLES,
  Group,
  Button,
  useObjectRef,
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AdminRoleInfo, AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionAccessTableHeader, IFilterState } from './ConnectionAccessTableHeader/ConnectionAccessTableHeader';
import { ConnectionAccessTableInnerHeader } from './ConnectionAccessTableHeader/ConnectionAccessTableInnerHeader';
import { ConnectionAccessTableItem } from './ConnectionAccessTableItem';
import { getFilteredRoles, getFilteredUsers } from './getFilteredSubjects';

const styles = composes(
  css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
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
    ConnectionAccessTableHeader {
      flex: 0 0 auto;
    }
  `
);

interface Props {
  userList: AdminUserInfoFragment[];
  roleList: AdminRoleInfo[];
  grantedSubjects: string[];
  onGrant: (subjectIds: string[]) => void;
  disabled: boolean;
}

export const ConnectionAccessList: React.FC<Props> = observer(function ConnectionAccessList({
  userList,
  roleList,
  grantedSubjects,
  onGrant,
  disabled,
}) {
  const props = useObjectRef({ onGrant });
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();
  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));
  const selectedList = useMemo(() => computed(
    () => Array.from(selectedSubjects.entries()).filter(([key, value]) => value).map(([key]) => key)
  ), [selectedSubjects]);

  const grant = useCallback(() => {
    props.onGrant(selectedList.get());
    selectedSubjects.clear();
  }, []);

  const roles = useMemo(() => computed(() => getFilteredRoles(
    roleList, filterState.filterValue
  )), [filterState, roleList]);

  const users = useMemo(() => computed(() => getFilteredUsers(
    userList, filterState.filterValue
  )), [filterState, userList]);

  return styled(style)(
    <Group box medium overflow>
      <container>
        <ConnectionAccessTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selectedList.get().length} mod={['unelevated']} onClick={grant}>{translate('connections_connection_access_grant')}</Button>
        </ConnectionAccessTableHeader>
        <table-container>
          <Table selectedItems={selectedSubjects}>
            <ConnectionAccessTableInnerHeader />
            <TableBody>
              {!roles.get().length && !users.get().length && filterState.filterValue && (
                <TableItem item='tableInfo' selectDisabled>
                  <TableColumnValue colSpan={5}>
                    {translate('connections_connection_access_filter_no_result')}
                  </TableColumnValue>
                </TableItem>
              )}
              {roles.get().map(role => (
                <ConnectionAccessTableItem
                  key={role.roleId}
                  id={role.roleId}
                  name={role.roleName || ''}
                  description={role.description}
                  icon='/icons/role.svg'
                  iconTooltip='connections_connection_access_role_tooltip'
                  disabled={disabled || grantedSubjects.includes(role.roleId)}
                />
              ))}
              {users.get().map(user => (
                <ConnectionAccessTableItem
                  key={user.userId}
                  id={user.userId}
                  name={user.userId}
                  icon='/icons/user.svg'
                  iconTooltip={translate('connections_connection_access_user_tooltip')}
                  disabled={disabled || grantedSubjects.includes(user.userId)}
                />
              ))}
            </TableBody>
          </Table>
        </table-container>
      </container>
    </Group>
  );
});
