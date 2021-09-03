/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { NavNodeViewService, useNode } from '@cloudbeaver/core-app';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

interface IFolderTabRendererProps {
  nodeId: string;
  folderId: string;
  style?: ComponentStyle;
}

export const FolderTabRenderer = observer<IFolderTabRendererProps>(function FolderTabRenderer({
  nodeId,
  folderId,
  style,
}) {
  const navNodeViewService = useService(NavNodeViewService);

  for (const tab of navNodeViewService.tabs) {
    const Tab = tab(nodeId, folderId);

    if (Tab) {
      return <Tab nodeId={nodeId} folderId={folderId} style={style} />;
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

  return styled(useStyles(style))(
    <Tab tabId={nodeId}>
      {nodeInfo.node?.icon && <TabIcon icon={nodeInfo.node.icon} />}
      <TabTitle>{nodeInfo.node?.name}</TabTitle>
    </Tab>
  );
});
