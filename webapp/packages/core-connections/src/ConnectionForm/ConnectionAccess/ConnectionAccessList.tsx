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
  const subjectsSelected = useMemo(() => computed(
    () => Array.from(selectedSubjects.values()).some(Boolean)
  ), [selectedSubjects]);

  const grant = useCallback(() => {
    const subjectsToGrant = [];

    for (const [subject, value] of selectedSubjects) {
      if (value) {
        subjectsToGrant.push(subject);
      }
    }

    props.onGrant(subjectsToGrant);
    selectedSubjects.clear();
  }, []);

  const roles = useMemo(() => computed(() => getFilteredRoles(
    roleList, filterState.filterValue
  )), [filterState.filterValue, roleList]);

  const users = useMemo(() => computed(() => getFilteredUsers(
    userList, filterState.filterValue
  )), [filterState.filterValue, userList]);

  return styled(style)(
    <Group box medium>
      <ConnectionAccessTableHeader filter={filterState} disabled={disabled}>
        <Button disabled={disabled || !subjectsSelected.get()} mod={['raised']} onClick={grant}>{translate('connections_connection_access_grant')}</Button>
      </ConnectionAccessTableHeader>
      <Table selectedItems={selectedSubjects}>
        <ConnectionAccessTableInnerHeader />
        <TableBody>
          {!roles.get().length && !users.get().length && filterState.filterValue && (
            <TableItem item='tableInfo'>
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
              iconTooltip={translate('connections_connection_access_role_tooltip')}
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
    </Group>
  );
});
