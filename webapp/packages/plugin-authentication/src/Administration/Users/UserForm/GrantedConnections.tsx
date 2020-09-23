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
  Table, TableHeader, TableColumnHeader, TableBody,
  TableItem, TableColumnValue, TableItemSelect, StaticImage, TextPlaceholder
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminSubjectType, ConnectionInfo, AdminConnectionGrantInfo } from '@cloudbeaver/core-sdk';
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
    StaticImage {
      display: flex;
      width: 16px;
    }
  `
);

type Props = {
  grantedConnections: AdminConnectionGrantInfo[];
  connections: ConnectionInfo[];
  selectedConnection: Map<string, boolean>;
  disabled: boolean;
  onChange?: () => void;
  className?: string;
}

export const GrantedConnections = observer(function GrantedConnections({
  grantedConnections,
  connections,
  selectedConnection,
  disabled,
  onChange,
  className,
}: Props) {
  const style = useStyles(styles);
  const translate = useTranslate();
  const driversResource = useService(DBDriverResource);
  const getConnectionPermission = useCallback((connectionId: string) => grantedConnections
    ?.find(connectionPermission => connectionPermission.connectionId === connectionId), [grantedConnections]);

  if (connections.length === 0) {
    return <TextPlaceholder>{translate('authentication_administration_user_connections_empty')}</TextPlaceholder>;
  }

  return styled(style)(
    <box as='div'>
      <Table selectedItems={selectedConnection} onSelect={onChange} className={className}>
        <TableHeader>
          <TableColumnHeader min/>
          <TableColumnHeader min/>
          <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
          <TableColumnHeader>{translate('authentication_administration_user_connections_access_granted_by')}</TableColumnHeader>
          <TableColumnHeader></TableColumnHeader>
        </TableHeader>
        <TableBody>
          {connections.map((connection) => {
            const connectionPermission = getConnectionPermission(connection.id);
            const driver = driversResource.get(connection.driverId);
            const isRoleProvided = connectionPermission?.subjectType === AdminSubjectType.Role;

            return (
              <TableItem key={connection.id} item={connection.id} selectDisabled={disabled || isRoleProvided}>
                <TableColumnValue centerContent flex>
                  <TableItemSelect disabled={disabled || isRoleProvided} checked={disabled || isRoleProvided}/>
                </TableColumnValue>
                <TableColumnValue><StaticImage icon={driver?.icon} /></TableColumnValue>
                <TableColumnValue>{connection.name}</TableColumnValue>
                <TableColumnValue>
                  {connectionPermission && (isRoleProvided
                    ? `${translate('authentication_administration_user_connections_access_granted_role')} ${connectionPermission?.subjectId}`
                    : translate('authentication_administration_user_connections_access_granted_directly'))}
                </TableColumnValue>
                <TableColumnValue></TableColumnValue>
              </TableItem>
            );
          })}
        </TableBody>
      </Table>
    </box>
  );
});
