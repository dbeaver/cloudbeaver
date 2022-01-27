/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { TabHandlerTabComponent, useNode } from '@cloudbeaver/core-app';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabIcon, Tab, TabTitle, ITabData } from '@cloudbeaver/core-ui';
import { CaptureViewContext, useDataContext } from '@cloudbeaver/core-view';

import type { IObjectViewerTabState } from './IObjectViewerTabState';

export const ObjectViewerTab: TabHandlerTabComponent<IObjectViewerTabState> = observer(function ObjectViewerTab({
  tab, handler, onSelect, onClose, style,
}) {
  // const connectionsInfoResource = useService(ConnectionInfoResource);
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);
  const { node } = useNode(tab.handlerState.objectId);
  const handleSelect = ({ tabId }: ITabData<any>) => onSelect(tabId);
  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;
  const title = node?.name || tab.handlerState.tabTitle;

  // if (node){
  //   tabMenuContext.set(DATA_CONTEXT_NAV_NODE, node);
  //   const connection = connectionsInfoResource.getConnectionForNode(node.id);

  //   if (connection) {
  //     tabMenuContext.set(DATA_CONTEXT_CONNECTION, connection);
  //   }
  // }

  return styled(useStyles(style))(
    <Tab
      tabId={tab.id}
      style={style}
      title={title}
      menuContext={tabMenuContext}
      onOpen={handleSelect}
      onClose={handleClose}
    >
      <TabIcon icon={node?.icon || tab.handlerState.tabIcon} />
      <TabTitle>{title}</TabTitle>
    </Tab>
  );
});

