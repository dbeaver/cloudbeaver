/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { type NavNodeTransformViewComponent, useNode } from '@cloudbeaver/plugin-navigation-tree';

export const NavNodeMetadataTab: NavNodeTransformViewComponent = observer(function NavNodeMetadataTab({
  folderId,
  nodeId,
  style,
}) {
  const translate = useTranslate();
  const styles = useStyles(style);
  const nodeInfo = useNode(nodeId);
  const title = translate('plugin_object_viewer_object_info_tab');

  if (!nodeInfo.node) {
    return null;
  }

  const icon = 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/info.png';

  return styled(styles)(
    <Tab tabId={folderId} title={title}>
      <TabIcon icon={icon} />
      <TabTitle>{title}</TabTitle>
    </Tab>
  );
});
