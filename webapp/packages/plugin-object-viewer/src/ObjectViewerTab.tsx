/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { TabHandlerTabComponent, useNode } from '@cloudbeaver/core-app';
import { TabIcon, Tab, TabTitle, ITabData } from '@cloudbeaver/core-ui';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IObjectViewerTabState } from './IObjectViewerTabState';

export const ObjectViewerTab: TabHandlerTabComponent<IObjectViewerTabState> = observer(function ObjectViewerTab({
  tab, handler, onSelect, onClose, style,
}) {
  const { node } = useNode(tab.handlerState.objectId);
  const handleSelect = ({ tabId }: ITabData<any>) => onSelect(tabId);
  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;
  const title = node?.name || tab.handlerState.tabTitle;

  return styled(useStyles(style))(
    <Tab tabId={tab.id} style={style} title={title} onOpen={handleSelect} onClose={handleClose}>
      <TabIcon icon={node?.icon || tab.handlerState.tabIcon} />
      <TabTitle>{title}</TabTitle>
    </Tab>
  );
});
