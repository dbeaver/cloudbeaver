/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { TabElementProps } from '@cloudbeaver/core-blocks';

import { useTab } from './useTab';
import { useTabHandler } from './useTabHandler';

export const TabHandlerPanel = observer(function TabHandlerPanel({
  tabId,
}: TabElementProps) {
  const tab = useTab(tabId);
  const handler = useTabHandler(tab.handlerId);

  const TabHandlerPanel = handler.getPanelComponent();
  return <TabHandlerPanel tab={tab} handler={handler} />;
});
