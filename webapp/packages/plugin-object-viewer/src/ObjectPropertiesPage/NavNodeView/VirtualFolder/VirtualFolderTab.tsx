/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import type { NavNodeTransformViewComponent } from '@cloudbeaver/core-app';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { useStyles } from '@cloudbeaver/core-theming';

import { VirtualFolderUtils } from './VirtualFolderUtils';

export const VirtualFolderTab: NavNodeTransformViewComponent = function VirtualFolderTab({
  folderId,
  style,
}) {
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const styles = useStyles(style);
  const icon = 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/folder.png';

  return styled(styles)(
    <Tab tabId={folderId}>
      <TabIcon icon={icon} />
      <TabTitle>{nodeType}</TabTitle>
    </Tab>
  );
};
