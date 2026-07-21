/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentComponent, AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { s, SContext, type StyleRegistry, ToolsPanel, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabList, TabPanelList, TabPanelStyles, TabsState, TabStyles, TabTitleStyles } from '@cloudbeaver/core-ui';

import style from './shared/ConnectionsAdministration.module.css';
import tabStyle from './shared/ConnectionsAdministrationTab.module.css';
import tabPanelStyle from './shared/ConnectionsAdministrationTabPanel.module.css';
import TabTitleModuleStyles from './shared/ConnectionsAdministrationTabTitle.module.css';
import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService.js';
import { ConnectionsAdministrationTabService } from './ConnectionsAdministrationTabService.js';

const tabPanelRegistry: StyleRegistry = [[TabPanelStyles, { mode: 'append', styles: [tabPanelStyle] }]];

const mainTabsRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [tabStyle] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleModuleStyles] }],
];

export const ConnectionsAdministration: AdministrationItemContentComponent = observer(function ConnectionsAdministration({
  item,
  configurationWizard,
  sub,
  param,
}) {
  const translate = useTranslate();
  const connectionsAdministrationNavService = useService(ConnectionsAdministrationNavService);
  const connectionsAdministrationTabService = useService(ConnectionsAdministrationTabService);
  const styles = useS(style, tabStyle);

  function openSub({ tabId }: ITabData<AdministrationItemContentProps>) {
    if (sub?.name === tabId) {
      return;
    }

    connectionsAdministrationNavService.navToSub(tabId);
  }

  return (
    <TabsState
      selectedId={sub?.name}
      container={connectionsAdministrationTabService.tabsContainer}
      item={item}
      configurationWizard={configurationWizard}
      sub={sub}
      param={param ?? null}
      lazy
      onChange={openSub}
    >
      <ToolsPanel bottomBorder>
        <SContext registry={mainTabsRegistry}>
          <TabList
            className={s(styles, { tabList: true, administrationTabs: true })}
            aria-label={translate('plugin_connection_administration_label')}
            childrenFirst
            underline
          />
        </SContext>
      </ToolsPanel>
      <SContext registry={tabPanelRegistry}>
        <TabPanelList />
      </SContext>
    </TabsState>
  );
});
