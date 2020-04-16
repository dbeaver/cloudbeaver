/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { TabTitle, TabIcon } from '@dbeaver/core/blocks';

import { useTab } from './useTab';

type TabContentProps = {
  tabId: string;
  className?: string;
}

export const TabContent = observer(function TabContent({
  tabId,
}: TabContentProps) {
  const tab = useTab(tabId);

  return (
    <>
      <TabIcon icon={tab.icon} />
      <TabTitle title={tab.name} />
    </>
  );
});
