/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import styled, { css } from 'reshadow';

import {
  Table, TableHeader, TableColumnHeader, TableBody,
  TableItem, TableColumnValue, TableItemSelect, StaticImage,
  TextPlaceholder, ColoredContainer, BASE_CONTAINERS_STYLES, Group
} from '@cloudbeaver/core-blocks';
import { DBDriverResource, isCloudConnection } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminSubjectType } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IUserFormProps } from './UserFormService';

const styles = css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
      width: 100%;
    }
    StaticImage {
      display: flex;
      width: 24px;
    }
  `;

export const ConnectionAccess: TabContainerPanelComponent<IUserFormProps> = observer(function ConnectionAccess({
  controller,
  editing,
}) {
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();
  const driversResource = useService(DBDriverResource);
  const getConnectionPermission = useCallback(
    (connectionId: string) => controller.grantedConnections
      .find(connectionPermission => connectionPermission.connectionId === connectionId),
    [controller.grantedConnections]);
  const loading = controller.isLoading;
  const cloudExists = controller.connections.some(isCloudConnection);
  const localConnections = useMemo(() => computed(
    () => controller.connections.filter(connection => !isCloudConnection(connection))
  ), [controller.connections]);
  const isAdmin = controller.user.grantedRoles.includes('admin');

  if (controller.connections.length === 0) {
    return styled(style)(
      <ColoredContainer parent>
        <Group keepSize large>
          <TextPlaceholder>
            {translate('authentication_administration_user_connections_empty')}
          </TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  if (isAdmin) {
    return styled(style)(
      <ColoredContainer parent>
        <Group keepSize large>
          <TextPlaceholder>
            {translate('connections_connection_access_admin_info')}
          </TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  return styled(style)(
    <ColoredContainer parent overflow>
      <Group box keepSize large>
        <Table selectedItems={controller.selectedConnections} size='big' onSelect={controller.handleConnectionsAccessChange}>
          <TableHeader>
            <TableColumnHeader min />
            <TableColumnHeader min />
            <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
            <TableColumnHeader>{translate('authentication_administration_user_connections_access_granted_by')}</TableColumnHeader>
          </TableHeader>
          <TableBody>
            {cloudExists && (
              <TableItem item='cloudInfo' selectDisabled>
                <TableColumnValue colSpan={5}>
                  {translate('cloud_connections_access_placeholder')}
                </TableColumnValue>
              </TableItem>
            )}
            {localConnections.get().map(connection => {
              const connectionPermission = getConnectionPermission(connection.id);
              const driver = driversResource.get(connection.driverId);
              const isRoleProvided = connectionPermission?.subjectType === AdminSubjectType.Role;

              let grantedBy = '';
              if (isRoleProvided) {
                grantedBy = `${translate('authentication_administration_user_connections_access_granted_role')} ${connectionPermission?.subjectId}`;
              } else if (connectionPermission) {
                grantedBy = translate('authentication_administration_user_connections_access_granted_directly');
              }

              return (
                <TableItem
                  key={connection.id}
                  item={connection.id}
                  selectDisabled={isRoleProvided}
                >
                  <TableColumnValue centerContent flex>
                    <TableItemSelect
                      disabled={loading || isRoleProvided}
                      checked={isRoleProvided}
                    />
                  </TableColumnValue>
                  <TableColumnValue><StaticImage icon={driver?.icon} /></TableColumnValue>
                  <TableColumnValue title={connection.name} ellipsis>{connection.name}</TableColumnValue>
                  <TableColumnValue title={grantedBy}>
                    {grantedBy}
                  </TableColumnValue>
                </TableItem>
              );
            })}
          </TableBody>
        </Table>
      </Group>
    </ColoredContainer>
  );
});
