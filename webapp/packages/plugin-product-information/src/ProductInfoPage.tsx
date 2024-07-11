/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type AdministrationItemContentComponent, AdministrationItemService } from '@cloudbeaver/core-administration';
import { s, SContext, StyleRegistry, ToolsPanel, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ITabData, Tab, TabList, TabPanel, TabPanelStyles, TabsState, TabStyles, TabTitle, TabTitleStyles } from '@cloudbeaver/core-ui';

import { ProductInfoBootstrap } from './ProductInfoBootstrap';
import { ProductInfoNavigationService } from './ProductInfoNavigationService';
import style from './shared/ProductInfoPage.module.css';
import tabStyle from './shared/ProductInfoPageTab.module.css';
import tabPanelStyle from './shared/ProductInfoPageTabPanel.module.css';
import TabTitleModuleStyles from './shared/ProductInfoPageTabTitle.module.css';

const tabPanelRegistry: StyleRegistry = [[TabPanelStyles, { mode: 'append', styles: [tabPanelStyle] }]];

const mainTabsRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [tabStyle] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleModuleStyles] }],
];

export const ProductInfoPage: AdministrationItemContentComponent = observer(function ProductInfoPage({ sub, param, item, configurationWizard }) {
  const translate = useTranslate();
  const productInfoNavigationService = useService(ProductInfoNavigationService);
  const administrationItemService = useService(AdministrationItemService);
  const subs = administrationItemService.getItem(ProductInfoBootstrap.PAGE_NAME, configurationWizard)?.sub || [];
  const subName = sub?.name || item.defaultSub || subs[0]?.name;
  const styles = useS(style, tabStyle);

  function openSub({ tabId }: ITabData) {
    if (subName === tabId) {
      return;
    }
    param = null;
    productInfoNavigationService.navToSub(tabId, param || undefined);
  }

  console.log({ sub, param, item, configurationWizard, subs, items: administrationItemService.items });

  return (
    <TabsState selectedId={subName} lazy onChange={openSub}>
      <ToolsPanel bottomBorder>
        <TabList className={s(styles, { tabList: true, administrationTabs: true })} aria-label="Product Info Administration pages" underline>
          <SContext registry={mainTabsRegistry}>
            {subs.map(sub => (
              // TODO mark tab for version as updated
              <Tab key={'tab' + sub.name} tabId={sub.name}>
                <TabTitle>{translate(sub.title ?? sub.name)}</TabTitle>
              </Tab>
            ))}
          </SContext>
        </TabList>
      </ToolsPanel>
      <SContext registry={tabPanelRegistry}>
        {subs.map(sub => {
          const Component = sub.getComponent?.();

          return (
            <TabPanel key={'tabPanel' + sub.name} tabId={sub.name}>
              {Component ? <Component configurationWizard={configurationWizard} sub={sub} param={param!} /> : null}
            </TabPanel>
          );
        })}
      </SContext>
    </TabsState>
  );
});
