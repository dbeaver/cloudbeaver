/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Loader, SContext, type StyleRegistry, useExecutor } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabList, TabPanel, TabsState, TabStyles } from '@cloudbeaver/core-ui';
import { CaptureView } from '@cloudbeaver/core-view';
import { useConnectionTypeLoader } from '@cloudbeaver/core-connections';
import { clsx } from '@dbeaver/ui-kit';

import { NavigationTabsService } from '../NavigationTabsService.js';
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
  const navigationTabsService = useService(NavigationTabsService);
  const navigationTabsSettingsService = useService(NavigationTabsSettingsService);
  // TODO: we get exception when after closing the restored page trying to open another
  //       it's related to hooks order and state restoration
  const [restoring, setRestoring] = useState(false);

  const handleSelect = useCallback((tabId: string) => navigationTabsService.selectTab(tabId), [navigationTabsService]);
  const handleClose = useCallback((tabId: string) => navigationTabsService.closeTab(tabId), [navigationTabsService]);

  useConnectionTypeLoader();

  function unloadTabs() {
    navigationTabsService.unloadTabs();
  }

  async function restoreTabs() {
    setRestoring(true);
    try {
      await navigationTabsService.restoreTabs();
    } finally {
      setRestoring(false);
    }
  }

  function handleTabChange(tab: ITabData<any>) {
    handleSelect(tab.tabId);
  }

  const handleReorder = useCallback(
    (draggedTabId: string, targetTabId: string, position: 'before' | 'after') => {
      navigationTabsService.reorderTab(draggedTabId, {
        tabId: targetTabId,
        position,
      });
    },
    [navigationTabsService],
  );

  useExecutor({
    executor: userInfoResource.onUserChange,
    postHandlers: [unloadTabs, restoreTabs],
  });

  useExecutor({
    executor: navigationTabsService.onStateUpdate,
    postHandlers: [unloadTabs, restoreTabs],
  });

  useEffect(() => {
    unloadTabs();
    restoreTabs();
  }, []);

  if (navigationTabsService.tabIdList.length === 0) {
    return <NavigationWelcomeScreen />;
  }

  return (
    <CaptureView view={navigationTabsService} className={clsx('tw:flex-1 tw:flex tw:overflow-auto', className)}>
      <Loader loading={restoring}>
        <TabsState
          currentTabId={navigationTabsService.currentTabId}
          reorderStateKey="navigation-tabs-bar"
          tabList={navigationTabsService.tabIdList}
          enabledBaseActions
          autoSelect
          onChange={handleTabChange}
          onReorder={handleReorder}
        >
          <div className="tw:outline-none! tw:flex-1 tw:flex tw:flex-col tw:max-w-full">
            <TabList
              className={clsx(
                'tw:overflow-auto tw:max-w-full theme-background-secondary theme-text-on-secondary',
                navigationTabsSettingsService.hasMultipleRows && 'tw:flex-wrap',
              )}
            >
              <SContext registry={tabsRegistry}>
                {navigationTabsService.tabIdList.map(tabId => (
                  <TabHandlerTab key={tabId} tabId={tabId} onSelect={handleSelect} onClose={handleClose} />
                ))}
              </SContext>
            </TabList>
            {navigationTabsService.tabIdList.map(tabId => (
              <TabPanel key={tabId} className="tw:flex-1 tw:flex tw:overflow-hidden tw:relative" tabId={tabId} lazy>
                {() => <TabHandlerPanel tabId={tabId} />}
              </TabPanel>
            ))}
          </div>
        </TabsState>
      </Loader>
    </CaptureView>
  );
});
