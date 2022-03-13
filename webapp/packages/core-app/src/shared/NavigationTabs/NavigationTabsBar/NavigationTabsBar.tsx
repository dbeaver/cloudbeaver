/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { TextPlaceholder, useExecutor } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabsBox, TabPanel, BASE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { CaptureView } from '@cloudbeaver/core-view';

import { NavigationTabsService } from '../NavigationTabsService';
import { TabHandlerPanel } from './Tabs/TabHandlerPanel';
import { TabHandlerTab } from './Tabs/TabHandlerTab';

const styles = css`
    Tab {
      composes: theme-ripple theme-background-background theme-text-text-primary-on-light from global;
    }
    tabs {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    TabsBox {
      outline: none;
    }
    CaptureView {
      flex: 1;
      display: flex;
      overflow: auto;
    }
  `;

export const NavigationTabsBar = observer(function NavigationTabsBar() {
  const userInfoResource = useService(UserInfoResource);
  const navigation = useService(NavigationTabsService);
  // TODO: we get exception when after closing the restored page trying to open another
  //       it's related to hooks order and state restoration
  const style = useStyles(BASE_TAB_STYLES, styles);
  const translate = useTranslate();

  const handleSelect = useCallback((tabId: string) => navigation.selectTab(tabId), [navigation]);
  const handleClose = useCallback((tabId: string) => navigation.closeTab(tabId), [navigation]);

  function unloadTabs() {
    navigation.unloadTabs();
  }

  async function restoreTabs() {
    await navigation.restoreTabs();
  }

  useExecutor({
    executor: userInfoResource.onDataUpdate,
    postHandlers: [unloadTabs, restoreTabs],
  });

  useEffect(() => {
    unloadTabs();
    restoreTabs();
  }, []);

  if (navigation.tabIdList.length === 0) {
    return <TextPlaceholder>{translate('app_shared_navigationTabsBar_placeholder')}</TextPlaceholder>;
  }

  return styled(style)(
    <CaptureView view={navigation}>
      <TabsBox
        currentTabId={navigation.currentTabId}
        tabs={navigation.tabIdList.map(tabId => (
          <TabHandlerTab key={tabId} tabId={tabId} style={styles} onSelect={handleSelect} onClose={handleClose} />
        ))}
        tabList={navigation.tabIdList}
        style={styles}
        tabIndex={0}
        enabledBaseActions
      >
        {navigation.tabIdList.map(tabId => (
          <TabPanel key={tabId} tabId={tabId} lazy>
            <TabHandlerPanel tabId={tabId} />
          </TabPanel>
        ))}
      </TabsBox>
    </CaptureView>
  );
});
