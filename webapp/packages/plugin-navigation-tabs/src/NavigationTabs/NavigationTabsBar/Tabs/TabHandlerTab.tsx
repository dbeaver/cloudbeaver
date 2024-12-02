/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTab } from './useTab.js';
import { useTabHandler } from './useTabHandler.js';

interface IProps {
  tabId: string;
  onSelect: (tabId: string) => void;
  onClose?: (tabId: string) => void;
}

export const TabHandlerTab = observer<IProps>(function TabHandlerTab({ tabId, onSelect, onClose }) {
  const tab = useTab(tabId);
  const handler = useTabHandler(tab.handlerId);

  const TabHandlerTab = handler.getTabComponent();

  return <TabHandlerTab tab={tab} handler={handler} onSelect={onSelect} onClose={onClose} />;
});
