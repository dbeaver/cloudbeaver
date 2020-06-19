/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { Style } from '@cloudbeaver/core-theming';

import { useTab } from './useTab';
import { useTabHandler } from './useTabHandler';

type Props = {
  tabId: string;
  onSelect: (tabId: string) => void;
  onClose?: (tabId: string) => void;
  style: Style[];
}

export const TabHandlerTab = observer(function TabHandlerTab({
  tabId, onSelect, onClose, style,
}: Props) {
  const tab = useTab(tabId);
  const handler = useTabHandler(tab.handlerId);

  const TabHandlerTab = handler.getTabComponent();
  return <TabHandlerTab tab={tab} handler={handler} onSelect={onSelect} onClose={onClose} style={style} />;
});
