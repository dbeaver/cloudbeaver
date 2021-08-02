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
  useObjectRef
} from '@cloudbeaver/core-blocks';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
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
    ConnectionAccessTableHeader {
      flex: 0 0 auto;
    }
    table-container {
      overflow: auto;
    }
  `
);

interface Props {
  grantedUsers: AdminUserInfoFragment[];
  grantedRoles: AdminRoleInfo[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const ConnectionAccessGrantedList: React.FC<Props> = observer(function ConnectionAccessGrantedList({
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
  const selectedList = useMemo(() => computed(
    () => Array.from(selectedSubjects.entries()).filter(([key, value]) => value).map(([key]) => key)
  ), [selectedSubjects]);

  const revoke = useCallback(() => {
    props.onRevoke(selectedList.get());
    selectedSubjects.clear();
  }, []);

  const roles = useMemo(() => computed(() => getFilteredRoles(
    grantedRoles, filterState.filterValue
  )), [filterState, grantedRoles]);

  const users = useMemo(() => computed(() => getFilteredUsers(
    grantedUsers, filterState.filterValue
  )), [filterState, grantedUsers]);

  let tableInfoText: TLocalizationToken = 'connections_connection_access_admin_info';
  if (!roles.get().length && !users.get().length) {
    if (filterState.filterValue) {
      tableInfoText = 'connections_connection_access_filter_no_result';
    } else {
      tableInfoText = 'connections_connection_access_empty_table_placeholder';
    }
  }

  return styled(style)(
    <Group box medium overflow>
      <container>
        <ConnectionAccessTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selectedList.get().length} mod={['outlined']} onClick={revoke}>{translate('connections_connection_access_revoke')}</Button>
          <Button disabled={disabled} mod={['unelevated']} onClick={props.onEdit}>{translate('connections_connection_access_edit')}</Button>
        </ConnectionAccessTableHeader>
        <table-container>
          <Table selectedItems={selectedSubjects}>
            <ConnectionAccessTableInnerHeader />
            <TableBody>
              <TableItem item='tableInfo' selectDisabled>
                <TableColumnValue colSpan={5}>
                  {translate(tableInfoText)}
                </TableColumnValue>
              </TableItem>
              {roles.get().map(role => (
                <ConnectionAccessTableItem
                  key={role.roleId}
                  id={role.roleId}
                  name={role.roleName || ''}
                  description={role.description}
                  icon='/icons/role.svg'
                  iconTooltip={translate('connections_connection_access_role_tooltip')}
                  disabled={disabled}
                />
              ))}
              {users.get().map(user => (
                <ConnectionAccessTableItem
                  key={user.userId}
                  id={user.userId}
                  name={user.userId}
                  icon='/icons/user.svg'
                  iconTooltip={translate('connections_connection_access_user_tooltip')}
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
