/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { getComputed, Loader, useStateDelay, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DBObjectResource } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { NavNodeViewService, useNode, useChildren } from '@cloudbeaver/plugin-navigation-tree';

interface IFolderTabRendererProps {
  nodeId: string;
  folderId: string;
  parents: string[];
  style?: ComponentStyle;
}

export const FolderTabRenderer = observer<IFolderTabRendererProps>(function FolderTabRenderer({
  nodeId,
  folderId,
  parents,
  style,
}) {
  const navNodeViewService = useService(NavNodeViewService);

  for (const tab of navNodeViewService.tabs) {
    const Tab = tab(nodeId, folderId, parents);

    if (Tab) {
      return <Tab nodeId={nodeId} folderId={folderId} style={style} parents={parents} />;
    }
  }

  return <NavNodeTab nodeId={folderId} style={style} />;
});

interface INavNodeTabProps {
  nodeId: string;
  style?: ComponentStyle;
}

const NavNodeTab = observer<INavNodeTabProps>(function NavNodeTab({ nodeId, style }) {
  const nodeInfo = useNode(nodeId);
  const children = useChildren(nodeId);
  const dbObjectResource = useService(DBObjectResource);
  const childrenList = resourceKeyList(children.children || []);

  const loading = useStateDelay(getComputed(() => (
    nodeInfo.isLoaded() && nodeInfo.isLoading()
  ) || (
    children.isLoaded() && children.isLoading()
  ) || (
    dbObjectResource.isLoaded(childrenList) && dbObjectResource.isLoading(childrenList)
  )), 300);

  return styled(useStyles(style))(
    <Tab tabId={nodeId} title={nodeInfo.node?.name}>
      {nodeInfo.node?.icon && <TabIcon icon={nodeInfo.node.icon} />}
      <TabTitle>{nodeInfo.node?.name}</TabTitle>
      <tab-loader><Loader loading={loading} small /></tab-loader>
    </Tab>
  );
});
