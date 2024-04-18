/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, Group, SContext, StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabList, TabPanelList, TabsState, TabStyles, TabUnderlineStyleRegistry } from '@cloudbeaver/core-ui';

import style from './UserProfileOptionsPanel.m.css';
import UserProfileTabStyles from './UserProfileTab.m.css';
import { UserProfileTabsService } from './UserProfileTabsService';

export const tabsStyleRegistry: StyleRegistry = [...TabUnderlineStyleRegistry, [TabStyles, { mode: 'append', styles: [UserProfileTabStyles] }]];

export const UserProfileOptionsPanel = observer(function UserProfileOptionsPanel() {
  const styles = useS(style);
  const userProfileTabsService = useService(UserProfileTabsService);
  return (
    <ColoredContainer className={styles.userProfileOptionsPanel} parent compact vertical noWrap maximum>
      <TabsState container={userProfileTabsService.tabContainer} lazy>
        <Group box keepSize noWrap>
          <SContext registry={tabsStyleRegistry}>
            <TabList />
          </SContext>
        </Group>
        <Container vertical>
          <TabPanelList />
        </Container>
      </TabsState>
    </ColoredContainer>
  );
});
