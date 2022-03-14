/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { generateTabElement } from './generateTabElement';
import { BASE_TAB_STYLES } from './Tab/BASE_TAB_STYLES';
import { TabPanel } from './TabPanel';
import type { ITabInfo } from './TabsContainer/ITabsContainer';
import { TabsContext } from './TabsContext';

interface Props {
  style?: ComponentStyle;
}

export const TabPanelList = observer<Props>(function TabPanelList({
  style,
  children,
}) {
  const state = useContext(TabsContext);
  const styles = useStyles(BASE_TAB_STYLES, style);

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

  return styled(styles)(
    <>
      {displayed.map(generateTabElement(
        (tabInfo, key) => (
          <TabPanel
            key={key}
            tabId={key}
          >
            {renderPanel(tabInfo, key)}
          </TabPanel>
        ),
        state.props,
      )).flat()}
      {children}
    </>
  );
});
