/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type AdministrationItemContentComponent, AdministrationItemContentProps, AdministrationItemService } from '@cloudbeaver/core-administration';
import { s, SContext, StyleRegistry, ToolsPanel, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ITabData, TabList, TabPanelList, TabPanelStyles, TabsState, TabStyles, TabTitle, TabTitleStyles } from '@cloudbeaver/core-ui';

import { ProductInfoNavigationService } from './ProductInfoNavigationService';
import { ProductInfoService } from './ProductInfoService';
import style from './shared/ProductInfoPage.module.css';
import tabStyle from './shared/ProductInfoPageTab.module.css';
import tabPanelStyle from './shared/ProductInfoPageTabPanel.module.css';
import TabTitleModuleStyles from './shared/ProductInfoPageTabTitle.module.css';

const tabPanelRegistry: StyleRegistry = [[TabPanelStyles, { mode: 'append', styles: [tabPanelStyle] }]];

const mainTabsRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [tabStyle] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleModuleStyles] }],
];

export const ProductInfoPage: AdministrationItemContentComponent = observer(function ProductInfoPage(props) {
  const productInfoNavigationService = useService(ProductInfoNavigationService);
  const styles = useS(style, tabStyle);
  const productInfoService = useService(ProductInfoService);

  function openSub(data: ITabData<AdministrationItemContentProps>) {
    productInfoNavigationService.navToTab(data.tabId);
  }

  return (
    <TabsState item={props.item} configurationWizard={props.configurationWizard} container={productInfoService.tabsContainer} lazy onChange={openSub}>
      <ToolsPanel bottomBorder>
        <SContext registry={mainTabsRegistry}>
          <TabList className={s(styles, { tabList: true, administrationTabs: true })} aria-label="Product Info Administration pages" underline />
        </SContext>
      </ToolsPanel>
      <SContext registry={tabPanelRegistry}>
        <TabPanelList />
      </SContext>
    </TabsState>
  );
});
