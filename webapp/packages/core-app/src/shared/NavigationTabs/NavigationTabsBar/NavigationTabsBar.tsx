/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  TextPlaceholder, TabsBox, TabPanel, useFocus
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';
import { useActiveView } from '@cloudbeaver/core-view';

import { NavigationTabsService } from '../NavigationTabsService';
import { TabHandlerPanel } from './Tabs/TabHandlerPanel';
import { TabHandlerTab } from './Tabs/TabHandlerTab';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-background theme-text-text-primary-on-light from global;
    }
    tabs {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    TabsBox {
      outline: none;
    }
  `
);
const stylesArray = [styles];

export const NavigationTabsBar = observer(function NavigationTabsBar() {
  const navigation = useService(NavigationTabsService);
  // TODO: we get exception when after closing the restored page trying to open another
  //       it's related to hooks order and state restoration
  const style = useStyles(styles);
  const translate = useTranslate();

  const [onFocus, onBlur] = useActiveView(navigation.getView);
  const [ref] = useFocus<HTMLDivElement>({ onFocus, onBlur });

  const handleSelect = useCallback((tabId: string) => navigation.selectTab(tabId), [navigation]);
  const handleClose = useCallback((tabId: string) => navigation.closeTab(tabId), [navigation]);

  if (navigation.tabIdList.length === 0) {
    return <TextPlaceholder>{translate('app_shared_navigationTabsBar_placeholder')}</TextPlaceholder>;
  }

  return styled(style)(
    <TabsBox
      currentTabId={navigation.currentTabId}
      tabs={navigation.tabIdList.map(tabId => (
        <TabHandlerTab key={tabId} tabId={tabId} onSelect={handleSelect} onClose={handleClose} style={stylesArray}/>
      ))}
      style={stylesArray}
      tabIndex={0}
      ref={ref}
    >
      {navigation.tabIdList.map(tabId => (
        <TabPanel key={tabId} tabId={tabId}>
          <TabHandlerPanel tabId={tabId} />
        </TabPanel>
      ))}
    </TabsBox>
  );
});
