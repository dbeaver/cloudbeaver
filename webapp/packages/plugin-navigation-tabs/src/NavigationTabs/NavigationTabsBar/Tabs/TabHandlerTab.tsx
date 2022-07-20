/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { useTab } from './useTab';
import { useTabHandler } from './useTabHandler';

interface IProps {
  tabId: string;
  onSelect: (tabId: string) => void;
  onClose?: (tabId: string) => void;
  style: ComponentStyle;
}

export const TabHandlerTab = observer<IProps>(function TabHandlerTab({
  tabId, onSelect, onClose, style,
}) {
  const tab = useTab(tabId);
  const handler = useTabHandler(tab.handlerId);

  const TabHandlerTab = handler.getTabComponent();
  return <TabHandlerTab tab={tab} handler={handler} style={style} onSelect={onSelect} onClose={onClose} />;
});
