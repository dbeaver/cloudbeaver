/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
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

  if (!nodeInfo.node) {
    return null;
  }

  const icon = 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/info.png';

  return styled(styles)(
    <Tab tabId={folderId}>
      <TabIcon icon={icon} />
      <TabTitle>{translate('plugin_object_viewer_object_info_tab')}</TabTitle>
    </Tab>
  );
});
