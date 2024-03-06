/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TabIcon, TabNew, TabTitle } from '@cloudbeaver/core-ui';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';

import { VirtualFolderUtils } from './VirtualFolderUtils';

export const VirtualFolderTab: NavNodeTransformViewComponent = function VirtualFolderTab({ folderId }) {
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const icon = 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/folder.png';

  return (
    <TabNew tabId={folderId} title={nodeType}>
      <TabIcon icon={icon} />
      <TabTitle>{nodeType}</TabTitle>
    </TabNew>
  );
};
