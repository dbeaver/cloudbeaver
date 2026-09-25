/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, s, SContext, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabList, TabPanelList, TabsState, VerticalTabsStyleRegistry } from '@cloudbeaver/core-ui';

import style from './UserProfileOptionsPanel.module.css';
import { UserProfileTabsService } from './UserProfileTabsService.js';

export const UserProfileOptionsPanel = observer(function UserProfileOptionsPanel() {
  const styles = useS(style);
  const userProfileTabsService = useService(UserProfileTabsService);

  return (
    <ColoredContainer className={s(styles, { userProfileOptionsPanel: true })} noWrap maximum>
      <TabsState
        container={userProfileTabsService.tabContainer}
        currentTabId={userProfileTabsService.selectedTabId}
        orientation="vertical"
        autoSelect={false}
        lazy
        onChange={tab => userProfileTabsService.open(tab.tabId)}
      >
        <SContext registry={VerticalTabsStyleRegistry}>
          <TabList vertical />
        </SContext>
        <Container overflow vertical noWrap>
          <TabPanelList />
        </Container>
      </TabsState>
    </ColoredContainer>
  );
});
