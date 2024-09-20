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

export const TabHandlerPanel = observer<{ tabId: string }>(function TabHandlerPanel({ tabId }) {
  const tab = useTab(tabId);
  const handler = useTabHandler(tab.handlerId);

  const TabHandlerPanel = handler.getPanelComponent();
  return <TabHandlerPanel tab={tab} handler={handler} />;
});
