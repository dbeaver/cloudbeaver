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
  IFilterState,
  useObjectRef
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AdminRoleInfo, AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionAccessTableHeader } from './ConnectionAccessTableHeader/ConnectionAccessTableHeader';
import { ConnectionAccessTableInnerHeader } from './ConnectionAccessTableHeader/ConnectionAccessTableInnerHeader';
import { ConnectionAccessTableItem } from './ConnectionAccessTableitem';
import { getFilteredRoles, getFilteredUsers } from './getFilteredSubjects';

const styles = composes(
  css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    Group {
      height: 100%;
      position: relative;
      overflow: auto !important;
    }
    Table {
      flex: 1;
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
  const subjectsSelected = useMemo(() => computed(() => Array.from(selectedSubjects.values()).some(Boolean)), []);

  const revoke = useCallback(() => {
    const subjectsToRevoke = [];
    for (const [subject, value] of selectedSubjects) {
      if (value) {
        subjectsToRevoke.push(subject);
      }
    }

    props.onRevoke(subjectsToRevoke);
    selectedSubjects.clear();
  }, []);

  const roles = useMemo(() => computed(() => getFilteredRoles(
    grantedRoles, filterState.filterValue
  )), [filterState.filterValue, grantedRoles]);

  const users = useMemo(() => computed(() => getFilteredUsers(
    grantedUsers, filterState.filterValue
  )), [filterState.filterValue, grantedUsers]);

  let tableInfoText: string = translate('connections_connection_access_admin_info');
  if (!roles.get().length && !users.get().length) {
    if (filterState.filterValue) {
      tableInfoText = translate('connections_connection_access_filter_no_result');
    } else {
      tableInfoText = translate('connections_connection_access_empty_table_placeholder');
    }
  }

  return styled(style)(
    <Group box medium>
      <ConnectionAccessTableHeader filter={filterState} disabled={disabled}>
        <Button disabled={disabled || !subjectsSelected.get()} mod={['outlined']} onClick={revoke}>{translate('connections_connection_access_revoke')}</Button>
        <Button disabled={disabled} mod={['raised']} onClick={props.onEdit}>{translate('connections_connection_access_edit')}</Button>
      </ConnectionAccessTableHeader>
      <Table selectedItems={selectedSubjects}>
        <ConnectionAccessTableInnerHeader />
        <TableBody>
          <TableItem item='tableInfo'>
            <TableColumnValue colSpan={5}>
              {tableInfoText}
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
    </Group>
  );
});
