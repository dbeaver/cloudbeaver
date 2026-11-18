/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TreeNode, TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { NavigationNodeRendererComponent } from '@cloudbeaver/plugin-navigation-tree';

import { DBAdminTabService } from '../DBAdminTabs/DBAdminTabService.js';
import { getDBAdminManagerIcon, getDBAdminManagerTitle } from '../getDBAdminManagerInfo.js';
import { parseDBAdminTreeItemId } from './DBAdminTreeItemId.js';

export const DBAdminTreeItem: NavigationNodeRendererComponent = observer(function DBAdminTreeItem({ nodeId, className }) {
  const translate = useTranslate();
  const connectionInfoResource = useService(ConnectionInfoResource);
  const dbAdminTabService = useService(DBAdminTabService);
  const item = parseDBAdminTreeItemId(nodeId);

  if (!item) {
    return null;
  }

  const title = translate(getDBAdminManagerTitle(item.manager));

  function open() {
    const connection = connectionInfoResource.getConnectionForNode(item!.adminNodeId);

    if (connection) {
      dbAdminTabService.open(createConnectionParam(connection), item!.manager);
    }
  }

  return (
    <TreeNode className={className} leaf onClick={open} onOpen={open}>
      <TreeNodeControl title={title}>
        <TreeNodeExpand leaf />
        <TreeNodeIcon icon={getDBAdminManagerIcon(item.manager)} />
        <TreeNodeName title={title}>{title}</TreeNodeName>
      </TreeNodeControl>
    </TreeNode>
  );
});
