/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Loader, s, SContext, type StyleRegistry, useExecutor, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabPanel, TabsBox, TabStyles } from '@cloudbeaver/core-ui';
import { CaptureView } from '@cloudbeaver/core-view';

import { NavigationTabsService } from '../NavigationTabsService.js';
import styles from './shared/NavigationTabsBar.module.css';
import NavigationTabsBarTab from './shared/NavigationTabsBarTab.module.css';
import { TabHandlerPanel } from './Tabs/TabHandlerPanel.js';
import { TabHandlerTab } from './Tabs/TabHandlerTab.js';
import { NavigationWelcomeScreen } from './NavigationWelcomeScreen.js';
import { NavigationTabsSettingsService } from '../NavigationTabsSettingsService.js';

interface Props {
  className?: string;
}

const tabsRegistry: StyleRegistry = [
  [
    TabStyles,
    {
      mode: 'append',
      styles: [NavigationTabsBarTab],
    },
  ],
];

export const NavigationTabsBar = observer<Props>(function NavigationTabsBar({ className }) {
  const userInfoResource = useService(UserInfoResource);
  const navigation = useService(NavigationTabsService);
  const navigationSettings = useService(NavigationTabsSettingsService);
  // TODO: we get exception when after closing the restored page trying to open another
  //       it's related to hooks order and state restoration
  const [restoring, setRestoring] = useState(false);
  const style = useS(styles);

  const handleSelect = useCallback((tabId: string) => navigation.selectTab(tabId), [navigation]);
  const handleClose = useCallback((tabId: string) => navigation.closeTab(tabId), [navigation]);

  function unloadTabs() {
    navigation.unloadTabs();
  }

  async function restoreTabs() {
    setRestoring(true);
    try {
      await navigation.restoreTabs();
    } finally {
      setRestoring(false);
    }
  }

  function handleTabChange(tab: ITabData<any>) {
    handleSelect(tab.tabId);
  }

  useExecutor({
    executor: userInfoResource.onUserChange,
    postHandlers: [unloadTabs, restoreTabs],
  });

  useExecutor({
    executor: navigation.onStateUpdate,
    postHandlers: [unloadTabs, restoreTabs],
  });

  useEffect(() => {
    unloadTabs();
    restoreTabs();
  }, []);

  if (navigation.tabIdList.length === 0) {
    return <NavigationWelcomeScreen />;
  }

  return (
    <CaptureView view={navigation} className={s(style, { captureView: true }, className)}>
      <Loader loading={restoring}>
        <TabsBox
          currentTabId={navigation.currentTabId}
          className={s(style, { tabsBox: true })}
          tabsClassName={s(style, { tabs: true })}
          tabs={
            <SContext registry={tabsRegistry}>
              {navigation.tabIdList.map(tabId => (
                <TabHandlerTab key={tabId} tabId={tabId} onSelect={handleSelect} onClose={handleClose} />
              ))}
            </SContext>
          }
          tabList={navigation.tabIdList}
          multipleRows={navigationSettings.hasMultipleRows}
          autoSelect
          enabledBaseActions
          onChange={handleTabChange}
        >
          {navigation.tabIdList.map(tabId => (
            <TabPanel key={tabId} tabId={tabId} lazy>
              {() => <TabHandlerPanel tabId={tabId} />}
            </TabPanel>
          ))}
        </TabsBox>
      </Loader>
    </CaptureView>
  );
});
