/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Container,
  Group,
  Table,
  TableBody,
  TableColumnHeader,
  TableColumnValue,
  TableHeader,
  TableItem,
  TextPlaceholder,
  useAutoLoad,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import {
  compareConnectionsInfo,
  ConnectionInfoOriginResource,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  DBDriverResource,
  isCloudConnection,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-resource';
import { type TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';
import { isDefined } from '@dbeaver/js-helpers';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import type { UserFormConnectionAccessPart } from './UserFormConnectionAccessPart.js';
import { UserFormConnectionTableItem } from './UserFormConnectionTableItem.js';

export const UserFormConnectionAccess: TabContainerPanelComponent<UserFormProps> = observer(function UserFormConnectionAccess({ tabId }) {
  const translate = useTranslate();
  const tab = useTab(tabId);
  const driversResource = useService(DBDriverResource);
  const tabState = useTabState<UserFormConnectionAccessPart>();
  const projectLoader = useResource(UserFormConnectionAccess, ProjectInfoResource, CachedMapAllKey, { active: tab.selected });
  const key = ConnectionInfoProjectKey(...projectLoader.data.filter(isGlobalProject).map(project => project.id));
  const connectionsLoader = useResource(UserFormConnectionAccess, ConnectionInfoResource, key, { active: tab.selected });
  const connectionsOriginsLoader = useResource(UserFormConnectionAccess, ConnectionInfoOriginResource, key, { active: tab.selected });

  const connections = connectionsLoader.data.filter(isDefined).sort(compareConnectionsInfo);
  const connectionsOrigins = connectionsOriginsLoader.data.filter(isDefined);
  const cloudExists = connectionsOrigins.some(connectionOrigin => isCloudConnection(connectionOrigin.origin));
  const localConnectionsIds = new Set(
    connectionsOrigins.filter(connection => !isCloudConnection(connection.origin)).map(connection => connection.id),
  );
  const localConnections = connections.filter(connection => localConnectionsIds.has(connection.id));

  useResource(
    UserFormConnectionAccess,
    driversResource,
    resourceKeyList(Array.from(new Set(localConnections.map(connection => connection.driverId)))),
    {
      active: tab.selected,
    },
  );

  useAutoLoad(UserFormConnectionAccess, tabState, tab.selected);

  if (connections.length === 0) {
    return (
      <Container>
        <Group large>
          <TextPlaceholder>{translate('authentication_administration_user_connections_empty')}</TextPlaceholder>
        </Group>
      </Container>
    );
  }

  function handleSelect(connectionId: string, state: boolean) {
    if (state) {
      tabState.add(connectionId);
    } else {
      tabState.delete(connectionId);
    }
  }

  const disabled = tabState.isLoading();
  // let info: TLocalizationToken | null = null;

  // if (formState.mode === FormMode.Edit && tabState.isChanged()) {
  //   info = 'ui_save_reminder';
  // }

  return (
    <Container parent vertical>
      {/* {info && <InfoItem info={info} />} */}
      <Group box border large overflow>
        <Table onSelect={handleSelect}>
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
            {localConnections.map(connection => (
              <UserFormConnectionTableItem key={connection.id} connection={connection} disabled={disabled} />
            ))}
          </TableBody>
        </Table>
      </Group>
    </Container>
  );
});
