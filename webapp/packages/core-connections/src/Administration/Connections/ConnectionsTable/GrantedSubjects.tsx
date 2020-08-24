/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  Table, TableHeader, TableColumnHeader, TableBody, TableItem, TableColumnValue, TableItemSelect
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import {
  AdminSubjectType, AdminConnectionGrantInfo, AdminUserInfo, AdminRoleInfo
} from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

const styles = composes(
  css`
    box {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    box {
      flex: 1;
    }
    TableColumnHeader {
      border-top: solid 1px;
    }
    center {
      margin: auto;
    }
  `
);

type Props = {
  grantedSubjects: AdminConnectionGrantInfo[];
  users: AdminUserInfo[];
  roles: AdminRoleInfo[];
  selectedSubjects: Map<string, boolean>;
  disabled: boolean;
  onChange?: () => void;
  className?: string;
}

export const GrantedSubjects = observer(function GrantedSubjects({
  grantedSubjects,
  users,
  roles,
  selectedSubjects,
  disabled,
  onChange,
  className,
}: Props) {
  const translate = useTranslate();
  const getSubjectPermission = useCallback((subjectId: string) => grantedSubjects
      ?.find(subjectPermission => subjectPermission.subjectId === subjectId), [grantedSubjects]);

  if (users.length === 0 && roles.length) {
    return styled(useStyles(styles))(
      <center as='div'>{translate('authentication_administration_user_connections_empty')}</center>
    );
  }

  return styled(useStyles(styles))(
    <box as='div'>
      <Table selectedItems={selectedSubjects} onSelect={onChange} className={className}>
        <TableHeader>
          <TableColumnHeader min/>
          <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
          <TableColumnHeader></TableColumnHeader>
        </TableHeader>
        <TableBody>
          {roles.map(role => (
            <TableItem key={role.roleId} item={role.roleId} selectDisabled={disabled}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled} checked={disabled}/>
              </TableColumnValue>
              <TableColumnValue>{role.roleName}</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
          ))}
          {users.map((user) => {
            const connectionPermission = getSubjectPermission(user.userId);
            const isRoleProvided = connectionPermission?.subjectType === AdminSubjectType.Role;

            return (
              <TableItem key={user.userId} item={user.userId} selectDisabled={disabled || isRoleProvided}>
                <TableColumnValue centerContent flex>
                  <TableItemSelect disabled={disabled || isRoleProvided} checked={disabled || isRoleProvided}/>
                </TableColumnValue>
                <TableColumnValue>{user.userId}</TableColumnValue>
                <TableColumnValue></TableColumnValue>
              </TableItem>
            );
          })}
        </TableBody>
      </Table>
    </box>
  );
});
