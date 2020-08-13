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
  Table, TableHeader, TableColumnHeader, TableBody, TableItem, TableColumnValue, TableItemSelect, Loader
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminSubjectType, ConnectionInfo, AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  TableColumnHeader {
    border-top: solid 1px;
  }
`;

type Props = {
  user: AdminUserInfo;
  connections: ConnectionInfo[];
  grantedConnection: Map<string, boolean>;
  disabled: boolean;
  onChange?: () => void;
}

export const GrantedConnections = observer(function GrantedConnections({
  user,
  connections,
  grantedConnection,
  disabled,
  onChange,
}: Props) {
  const translate = useTranslate();
  const getConnectionPermission = useCallback((connectionId: string) => user.grantedConnections
      ?.find(connectionPermission => connectionPermission.connectionId === connectionId), [user]);

  return styled(useStyles(styles))(
    <Table selectedItems={grantedConnection} onSelect={onChange}>
      <TableHeader>
        <TableColumnHeader min/>
        <TableColumnHeader>{translate('authentication_user_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('authentication_administration_user_connections_access_role')}</TableColumnHeader>
        <TableColumnHeader></TableColumnHeader>
      </TableHeader>
      <TableBody>
        {connections.map((connection) => {
          const connectionPermission = getConnectionPermission(connection.id);
          const isRoleProvided = connectionPermission?.subjectType === AdminSubjectType.Role;

          return (
            <TableItem key={connection.id} item={connection.id}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled || isRoleProvided}/>
              </TableColumnValue>
              <TableColumnValue>{connection.name}</TableColumnValue>
              <TableColumnValue>{isRoleProvided && connectionPermission?.subjectId}</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
          );
        })}
      </TableBody>
    </Table>
  );
});
