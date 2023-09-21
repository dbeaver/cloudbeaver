/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ColoredContainer,
  Group,
  InfoItem,
  StaticImage,
  Table,
  TableBody,
  TableColumnHeader,
  TableColumnValue,
  TableHeader,
  TableItem,
  TableItemSelect,
  TextPlaceholder,
  useAutoLoad,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import {
  compareConnectionsInfo,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  DBDriverResource,
  isCloudConnection,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { AdminSubjectType, CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-sdk';
import { FormMode, type TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';
import { isDefined } from '@cloudbeaver/core-utils';

import type { UserFormProps } from '../AdministrationUserFormService';
import type { IUserFormConnectionAccessPart } from './IUserFormConnectionAccessPart';

export const UserFormConnectionAccess: TabContainerPanelComponent<UserFormProps> = observer(function UserFormConnectionAccess({ tabId, formState }) {
  const translate = useTranslate();
  const tab = useTab(tabId);
  const driversResource = useService(DBDriverResource);
  const tabState = useTabState<IUserFormConnectionAccessPart>();
  const projectLoader = useResource(UserFormConnectionAccess, ProjectInfoResource, CachedMapAllKey, { active: tab.selected });
  const connectionsLoader = useResource(
    UserFormConnectionAccess,
    ConnectionInfoResource,
    ConnectionInfoProjectKey(...projectLoader.data.filter(isGlobalProject).map(project => project.id)),
    { active: tab.selected },
  );

  const connections = connectionsLoader.data.filter(isDefined).sort(compareConnectionsInfo);
  const cloudExists = connections.some(isCloudConnection);
  const localConnections = connections.filter(connection => !isCloudConnection(connection));

  useResource(
    UserFormConnectionAccess,
    driversResource,
    resourceKeyList(Array.from(new Set(localConnections.map(connection => connection.driverId)))),
    {
      active: tab.selected,
    },
  );

  useAutoLoad(UserFormConnectionAccess, tabState, tab.selected);

  function getConnectionPermission(connectionId: string) {
    return tabState.grantedConnections.find(connectionPermission => connectionPermission.dataSourceId === connectionId);
  }

  if (connections.length === 0) {
    return (
      <ColoredContainer>
        <Group large>
          <TextPlaceholder>{translate('authentication_administration_user_connections_empty')}</TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  const disabled = tabState.isLoading();
  let info: TLocalizationToken | null = null;

  if (formState.mode === FormMode.Edit && tabState.isChanged()) {
    info = 'ui_save_reminder';
  }

  return (
    <ColoredContainer vertical gap>
      {info && <InfoItem info={info} />}
      <Group box large overflow>
        <Table selectedItems={tabState.selectedConnections}>
          <TableHeader fixed>
            <TableColumnHeader min />
            <TableColumnHeader min />
            <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
            <TableColumnHeader>{translate('authentication_administration_user_connections_access_granted_by')}</TableColumnHeader>
          </TableHeader>
          <TableBody>
            {cloudExists && (
              <TableItem item="cloudInfo" selectDisabled>
                <TableColumnValue colSpan={4}>{translate('cloud_connections_access_placeholder')}</TableColumnValue>
              </TableItem>
            )}
            {localConnections.map(connection => {
              const connectionPermission = getConnectionPermission(connection.id);
              const driver = driversResource.get(connection.driverId);
              const isTeamProvided = connectionPermission?.subjectType === AdminSubjectType.Team;

              let grantedBy = '';
              if (isTeamProvided) {
                grantedBy = `${translate('authentication_administration_user_connections_access_granted_team')} ${connectionPermission.subjectId}`;
              } else if (connectionPermission) {
                grantedBy = translate('authentication_administration_user_connections_access_granted_directly');
              }

              return (
                <TableItem key={connection.id} item={connection.id} selectDisabled={isTeamProvided}>
                  <TableColumnValue centerContent flex>
                    <TableItemSelect disabled={isTeamProvided || disabled} checked={isTeamProvided} />
                  </TableColumnValue>
                  <TableColumnValue centerContent>
                    <StaticImage icon={driver?.icon} width={24} block />
                  </TableColumnValue>
                  <TableColumnValue title={connection.name} ellipsis>
                    {connection.name}
                  </TableColumnValue>
                  <TableColumnValue title={grantedBy}>{grantedBy}</TableColumnValue>
                </TableItem>
              );
            })}
          </TableBody>
        </Table>
      </Group>
    </ColoredContainer>
  );
});
