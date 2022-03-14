/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, useDataResource, useMapResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ContainerResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { EPermission, usePermission } from '@cloudbeaver/core-root';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { ContextMenu, OptionsPanelService } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../../shared/NodesManager/NodeManagerUtils';
import { topMenuStyles } from '../../shared/topMenuStyles';
import { TopNavButton } from '../../shared/TopNavButton';
import { ConnectionSchemaManagerService } from '../ConnectionSchemaManagerService';
import { MENU_CONNECTION_DATA_CONTAINER_SELECTOR } from '../MENU_CONNECTION_DATA_CONTAINER_SELECTOR';
import { MENU_CONNECTION_SELECTOR } from '../MENU_CONNECTION_SELECTOR';

const menuStyles = css`
  Menu {
    max-height: 400px;
    overflow: auto;
    & menu-panel-item {
        overflow-x: hidden;
    }
    & menu-item-text {
        max-width: 400px;
        overflow-x: hidden;
        text-overflow: ellipsis;
    }
  }
`;

const removeDisableEffect = css`
  Button:disabled, Button[aria-disabled="true"] {
    opacity: 1;
  }
`;

const connectionMenu = css`
  MenuItem IconOrImage {
    background-color: #fff;
    padding: 2px;
    border-radius: var(--theme-form-element-radius);
  }
  menu-trigger-icon:not([|loading]) {
    background-color: #fff;
    border-radius: 4px;
    padding: 1px;
    
    & IconOrImage {
      width: 22px;
    }
  }
`;

const styles = css`
  connection-selector {
    display: flex;
    height: 100%;
    visibility: hidden;
    background: #338ecc;
      
    &[use|isVisible] {
      visibility: visible;
    }
  }
`;
export const ConnectionSelector = observer(function ConnectionSelector() {
  const style = useStyles(styles);
  const connectionsMenu = useMenu({ menu: MENU_CONNECTION_SELECTOR, local: true });
  const dataContainerMenu = useMenu({ menu: MENU_CONNECTION_DATA_CONTAINER_SELECTOR, local: true });
  const connectionSelectorService = useService(ConnectionSchemaManagerService);
  const optionsPanelService = useService(OptionsPanelService);
  const isEnabled = usePermission(EPermission.public);

  const drivers = useMapResource(ConnectionSelector, DBDriverResource, CachedMapAllKey, {
    active: isEnabled,
  });

  const connectionInfo = useMapResource(ConnectionSelector, ConnectionInfoResource, CachedMapAllKey, {
    active: isEnabled,
  });

  const connection = connectionSelectorService.currentConnection;
  const driver = drivers.resource.get(connection?.driverId || '');

  const contextsActive = getComputed(() => (
    isEnabled
    && !connectionInfo.isOutdated()
    && connection?.connected === true
    && !!connectionSelectorService.activeConnectionId
  ));

  useDataResource(ConnectionSelector, ContainerResource, {
    connectionId: connectionSelectorService.activeConnectionId!,
    catalogId: connectionSelectorService.activeObjectCatalogId,
  }, {
    active: contextsActive,
  });

  const objectContainerIcon = getComputed(() => {
    if (!connectionSelectorService.currentObjectSchema && !connectionSelectorService.currentObjectCatalog) {
      return undefined;
    }

    if (connectionSelectorService.currentObjectSchema?.object?.features?.includes(EObjectFeature.schema)) {
      // TODO move such kind of icon paths to a set of constants
      return 'schema_system';
    }

    if (connectionSelectorService.currentObjectCatalog?.object?.features?.includes(EObjectFeature.catalog)) {
      return 'database';
    }

    return 'database';
  });

  const objectContainerName = getComputed(() => {
    const value = NodeManagerUtils.concatSchemaAndCatalog(
      connectionSelectorService.currentObjectCatalogId,
      connectionSelectorService.currentObjectSchemaId
    );

    if (!value) {
      return 'app_topnavbar_connection_schema_manager_not_selected';
    }

    return value;
  });

  const isVisible = getComputed(() => (
    !optionsPanelService.active
    && (
      connectionSelectorService.isConnectionChangeable
      || connectionSelectorService.currentConnectionId !== null
    )
  ));

  useEffect(() => {
    if (isEnabled && connectionSelectorService.activeItem) {
      connectionSelectorService.updateContainer();
    }
  }, [connectionSelectorService.activeItem, isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return styled(style)(
    <connection-selector {...use({ isVisible })}>
      <ContextMenu
        menu={connectionsMenu}
        placement="bottom-end"
        style={[menuStyles, connectionMenu, topMenuStyles, removeDisableEffect]}
        disclosure
        modal
      >
        {({ loading }) => (
          <TopNavButton
            title={connection?.name || 'app_topnavbar_connection_schema_manager_not_selected'}
            icon={driver?.icon}
            style={[menuStyles, connectionMenu, removeDisableEffect]}
            menu={connectionSelectorService.isConnectionChangeable}
            loading={loading}
            secondary
          />
        )}
      </ContextMenu>
      <ContextMenu
        menu={dataContainerMenu}
        placement="bottom-end"
        style={[menuStyles, topMenuStyles]}
        disclosure
        modal
      >
        {({ loading }) => (
          <TopNavButton
            title={objectContainerName}
            icon={objectContainerIcon}
            style={[menuStyles, removeDisableEffect]}
            menu={
              connectionSelectorService.isObjectCatalogChangeable
            || connectionSelectorService.isObjectSchemaChangeable
            }
            loading={loading}
            secondary
          />
        )}
      </ContextMenu>
    </connection-selector>
  );
});
