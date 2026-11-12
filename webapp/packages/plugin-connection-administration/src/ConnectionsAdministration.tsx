/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import {
  AdministrationPageLayout,
  AdministrationPageNavigation,
  AdministrationTabList,
  type AdministrationItemContentComponent,
  type AdministrationItemContentProps,
} from '@cloudbeaver/core-administration';
import { useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService.js';
import { ConnectionsAdministrationTabService } from './ConnectionsAdministrationTabService.js';

export const ConnectionsAdministration: AdministrationItemContentComponent = observer(function ConnectionsAdministration({
  item,
  configurationWizard,
  sub,
  param,
}) {
  const translate = useTranslate();
  const connectionsAdministrationNavService = useService(ConnectionsAdministrationNavService);
  const connectionsAdministrationTabService = useService(ConnectionsAdministrationTabService);

  function openSub({ tabId }: ITabData<AdministrationItemContentProps>) {
    if (sub?.name === tabId) {
      return;
    }

    connectionsAdministrationNavService.navToSub(tabId);
  }

  return (
    <AdministrationPageLayout>
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
        <AdministrationPageNavigation>
          <AdministrationTabList aria-label={translate('plugin_connection_administration_label')} childrenFirst />
        </AdministrationPageNavigation>
        <TabPanelList contents />
      </TabsState>
    </AdministrationPageLayout>
  );
});
