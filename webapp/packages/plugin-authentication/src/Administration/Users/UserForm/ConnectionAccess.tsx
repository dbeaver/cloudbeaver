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
import { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { DBDriverResource, isCloudConnection } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminSubjectType } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { IUserFormProps } from './UserFormService';

const styles = composes(
  css`
    box {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    Table {
      composes: theme-background-surface from global;
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
      width: 24px;
    }
  `
);

export const ConnectionAccess: TabContainerPanelComponent<IUserFormProps> = observer(function ConnectionAccess({
  controller,
  editing,
}) {
  const style = useStyles(styles);
  const translate = useTranslate();
  const driversResource = useService(DBDriverResource);
  const getConnectionPermission = useCallback(
    (connectionId: string) => controller.grantedConnections
      ?.find(connectionPermission => connectionPermission.connectionId === connectionId),
    [controller.grantedConnections]);
  const disabled = controller.isLoading;

  if (controller.connections.length === 0) {
    return <TextPlaceholder>{translate('authentication_administration_user_connections_empty')}</TextPlaceholder>;
  }

  return styled(style)(
    <box as='div'>
      <Table selectedItems={controller.selectedConnections} size='big' onSelect={controller.handleConnectionsAccessChange}>
        <TableHeader>
          <TableColumnHeader min />
          <TableColumnHeader min />
          <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
          <TableColumnHeader>{translate('authentication_administration_user_connections_access_granted_by')}</TableColumnHeader>
          <TableColumnHeader />
        </TableHeader>
        <TableBody>
          {controller.connections.map(connection => {
            const connectionPermission = getConnectionPermission(connection.id);
            const driver = driversResource.get(connection.driverId);
            const isRoleProvided = connectionPermission?.subjectType === AdminSubjectType.Role;
            const cloud = isCloudConnection(connection);

            let grantedBy = '';
            if (isRoleProvided) {
              grantedBy = `${translate('authentication_administration_user_connections_access_granted_role')} ${connectionPermission?.subjectId}`;
            } else if (connectionPermission) {
              grantedBy = translate('authentication_administration_user_connections_access_granted_directly');
            } else if (cloud) {
              grantedBy = translate('authentication_administration_user_connections_access_granted_unmanaged');
            }

            return (
              <TableItem
                key={connection.id}
                item={connection.id}
                selectDisabled={disabled || isRoleProvided || cloud}
                disabled={cloud}
              >
                <TableColumnValue centerContent flex>
                  {!cloud && (
                    <TableItemSelect
                      disabled={disabled || isRoleProvided}
                      checked={disabled || isRoleProvided}
                    />
                  )}
                </TableColumnValue>
                <TableColumnValue><StaticImage icon={driver?.icon} /></TableColumnValue>
                <TableColumnValue>{connection.name}</TableColumnValue>
                <TableColumnValue>
                  {grantedBy}
                </TableColumnValue>
                <TableColumnValue />
              </TableItem>
            );
          })}
        </TableBody>
      </Table>
    </box>
  );
});
