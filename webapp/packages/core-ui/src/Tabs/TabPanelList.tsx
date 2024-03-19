/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { generateTabElement } from './generateTabElement';
import { TabPanel } from './TabPanel';
import type { ITabInfo } from './TabsContainer/ITabsContainer';
import { TabsContext } from './TabsContext';

export const TabPanelList = observer<React.PropsWithChildren>(function TabPanelList({ children }) {
  const state = useContext(TabsContext);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  if (!state.container) {
    throw new Error('Tabs container should be provided for TabPanelList');
  }

  function renderPanel(tabInfo: ITabInfo, key: string) {
    const Panel = tabInfo.panel();
    return <Panel tabId={key} {...state?.props} />;
  }

  const displayed = state.container.getDisplayed(state.props);

  return (
    <>
      {displayed
        .map(
          generateTabElement(
            (tabInfo, key) => (
              <TabPanel key={key} tabId={key}>
                {renderPanel(tabInfo, key)}
              </TabPanel>
            ),
            state.props,
          ),
        )
        .flat()}
      {children}
    </>
  );
});
