/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { TabHandlerTabProps, useNode } from '@cloudbeaver/core-app';
import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import { IObjectViewerTabState } from './IObjectViewerTabState';

export const ObjectViewerTab = observer(function ObjectViewerTab({
  tab, handler, onSelect, onClose, style,
}: TabHandlerTabProps<IObjectViewerTabState>) {
  const { node } = useNode(tab.handlerState.objectId);

  return styled(useStyles(style))(
    <Tab tabId={tab.id} onOpen={onSelect} onClose={onClose} style={style}>
      <TabIcon icon={node?.icon || tab.handlerState.tabIcon} />
      <TabTitle>{node?.name || tab.handlerState.tabTitle}</TabTitle>
    </Tab>
  );
});
