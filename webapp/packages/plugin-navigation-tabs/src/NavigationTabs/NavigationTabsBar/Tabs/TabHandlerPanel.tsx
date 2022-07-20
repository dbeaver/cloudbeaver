/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { TabElementProps } from '@cloudbeaver/core-ui';

import { useTab } from './useTab';
import { useTabHandler } from './useTabHandler';

export const TabHandlerPanel = observer<TabElementProps>(function TabHandlerPanel({
  tabId,
}) {
  const tab = useTab(tabId);
  const handler = useTabHandler(tab.handlerId);

  const TabHandlerPanel = handler.getPanelComponent();
  return <TabHandlerPanel tab={tab} handler={handler} />;
});
