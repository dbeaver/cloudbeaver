/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-ui';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';

import { VirtualFolderUtils } from './VirtualFolderUtils.js';

export const VirtualFolderTab: NavNodeTransformViewComponent = function VirtualFolderTab({ folderId }) {
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const icon = 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/folder.svg';

  return (
    <Tab tabId={folderId} title={nodeType}>
      <TabIcon icon={icon} />
      <TabTitle>{nodeType}</TabTitle>
    </Tab>
  );
};
