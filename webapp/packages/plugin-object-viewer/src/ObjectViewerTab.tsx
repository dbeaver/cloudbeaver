/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { useDataContext } from '@cloudbeaver/core-data-context';
import { ITabData, TabIcon, TabNew, TabTitle } from '@cloudbeaver/core-ui';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import type { TabHandlerTabComponent } from '@cloudbeaver/plugin-navigation-tabs';
import { useNode } from '@cloudbeaver/plugin-navigation-tree';

import type { IObjectViewerTabState } from './IObjectViewerTabState';

// TODO check wether we need style here?
export const ObjectViewerTab: TabHandlerTabComponent<IObjectViewerTabState> = observer(function ObjectViewerTab({ tab, onSelect, onClose }) {
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

  return (
    <TabNew tabId={tab.id} title={title} menuContext={tabMenuContext} onOpen={handleSelect} onClose={handleClose}>
      <TabIcon icon={node?.icon || tab.handlerState.tabIcon} />
      <TabTitle>{title}</TabTitle>
    </TabNew>
  );
});
