/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { useObjectInfoTooltip } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, useConnectionTypeColor } from '@cloudbeaver/core-connections';
import { useDataContext } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { type ITabData, Tab, TabIcon, TabTitle, useTab } from '@cloudbeaver/core-ui';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import type { TabHandlerTabComponent } from '@cloudbeaver/plugin-navigation-tabs';
import { useNode } from '@cloudbeaver/plugin-navigation-tree';

import type { IObjectViewerTabState } from './IObjectViewerTabState.js';

export const ObjectViewerTab: TabHandlerTabComponent<IObjectViewerTabState> = observer(function ObjectViewerTab({ tab, onSelect, onClose }) {
  const connectionInfoResource = useService(ConnectionInfoResource);
  const navNodeManagerService = useService(NavNodeManagerService);
  const projectInfoResource = useService(ProjectInfoResource);
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);
  const { node } = useNode(tab.handlerState.objectId);
  const handleSelect = ({ tabId }: ITabData<any>) => onSelect(tabId);
  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;
  const title = node?.name || tab.handlerState.tabTitle;
  const connection = tab.handlerState.connectionKey ? connectionInfoResource.get(tab.handlerState.connectionKey) : undefined;
  const project = connection ? projectInfoResource.get(connection.projectId) : undefined;
  const nodeInfo = node ? navNodeManagerService.getNodeContainerInfo(node.uri) : undefined;

  const tooltip = useObjectInfoTooltip(connection?.name, nodeInfo?.catalogId, nodeInfo?.schemaId, project?.name);
  const { selected } = useTab(tab.id);
  const typeColor = useConnectionTypeColor(tab.handlerState.connectionKey);

  return (
    <Tab
      style={{ backgroundColor: selected ? undefined : typeColor }}
      tabId={tab.id}
      title={`${title}${tooltip ? '\n' + tooltip : ''}`}
      menuContext={tabMenuContext}
      onOpen={handleSelect}
      onClose={handleClose}
    >
      <TabIcon icon={node?.icon || tab.handlerState.tabIcon} />
      <TabTitle>{title}</TabTitle>
    </Tab>
  );
});
