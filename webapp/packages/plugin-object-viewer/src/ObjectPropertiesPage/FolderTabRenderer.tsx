/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { NavNodeTab } from './NavNodeTab.js';

interface IFolderTabRendererProps {
  nodeId: string;
  folderId: string;
  parents: string[];
}

export const FolderTabRenderer = observer<IFolderTabRendererProps>(function FolderTabRenderer({ nodeId, folderId, parents }) {
  const navNodeViewService = useService(NavNodeViewService);

  for (const tab of navNodeViewService.tabs) {
    const Tab = tab(nodeId, folderId, parents);

    if (Tab) {
      return <Tab nodeId={nodeId} folderId={folderId} parents={parents} />;
    }
  }

  return <NavNodeTab nodeId={folderId} />;
});
