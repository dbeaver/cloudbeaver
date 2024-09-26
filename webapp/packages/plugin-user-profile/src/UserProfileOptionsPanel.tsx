/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, Group, s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabList, TabPanelList, TabsState, TabStyles } from '@cloudbeaver/core-ui';

import style from './UserProfileOptionsPanel.module.css';
import UserProfileTabStyles from './UserProfileTab.module.css';
import { UserProfileTabsService } from './UserProfileTabsService.js';

export const tabsStyleRegistry: StyleRegistry = [[TabStyles, { mode: 'append', styles: [UserProfileTabStyles] }]];

export const UserProfileOptionsPanel = observer(function UserProfileOptionsPanel() {
  const styles = useS(style);
  const userProfileTabsService = useService(UserProfileTabsService);
  return (
    <ColoredContainer className={s(styles, { userProfileOptionsPanel: true })} overflow parent compact vertical noWrap maximum>
      <TabsState container={userProfileTabsService.tabContainer} lazy>
        <Group overflow box keepSize noWrap>
          <SContext registry={tabsStyleRegistry}>
            <TabList underline />
          </SContext>
        </Group>
        <Container overflow vertical noWrap>
          <TabPanelList />
        </Container>
      </TabsState>
    </ColoredContainer>
  );
});
