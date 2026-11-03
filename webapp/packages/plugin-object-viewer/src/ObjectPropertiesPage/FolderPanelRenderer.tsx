/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { NavNodePanel } from './NavNodePanel.js';

interface IFolderPanelRendererProps {
  nodeId: string;
  folderId: string;
  parents: string[];
}

export const FolderPanelRenderer = observer<IFolderPanelRendererProps>(function FolderPanelRenderer({ nodeId, folderId, parents }) {
  const navNodeViewService = useService(NavNodeViewService);

  for (const panel of navNodeViewService.panels) {
    const Panel = panel(nodeId, folderId, parents);

    if (Panel) {
      return <Panel nodeId={nodeId} folderId={folderId} parents={parents} />;
    }
  }

  return <NavNodePanel nodeId={folderId} parents={parents} />;
});
