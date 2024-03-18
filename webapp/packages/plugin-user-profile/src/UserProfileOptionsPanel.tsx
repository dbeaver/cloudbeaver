/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ColoredContainer, Container, Group, useS, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import style from './UserProfileOptionsPanel.m.css';
import { UserProfileTabsService } from './UserProfileTabsService';

const tabsStyles = css`
  tab-inner {
    height: 100%;
  }

  tab-outer {
    height: 100%;
  }
`;

const oldTabStyles = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];

export const UserProfileOptionsPanel = observer(function UserProfileOptionsPanel() {
  const oldStyles = useStyles(oldTabStyles);
  const styles = useS(style);
  const userProfileTabsService = useService(UserProfileTabsService);
  return styled(oldStyles)(
    <ColoredContainer className={styles.userProfileOptionsPanel} parent compact vertical noWrap maximum>
      <TabsState container={userProfileTabsService.tabContainer} lazy>
        <Group box keepSize noWrap hidden>
          <TabList style={oldTabStyles} />
        </Group>
        <Container vertical>
          <TabPanelList />
        </Container>
      </TabsState>
    </ColoredContainer>,
  );
});
