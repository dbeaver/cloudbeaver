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

import { ProductInfoNavigationService } from './ProductInfoNavigationService.js';
import { ProductInfoService } from './ProductInfoService.js';

export const ProductInfoPage: AdministrationItemContentComponent = observer(function ProductInfoPage({ item, configurationWizard, sub }) {
  const translate = useTranslate();
  const productInfoNavigationService = useService(ProductInfoNavigationService);
  const productInfoService = useService(ProductInfoService);

  function openSub(data: ITabData<AdministrationItemContentProps>) {
    productInfoNavigationService.navigateToSub({ sub: data.tabId });
  }

  return (
    <AdministrationPageLayout>
      <TabsState
        currentTabId={sub?.name}
        item={item}
        configurationWizard={configurationWizard}
        container={productInfoService.tabsContainer}
        lazy
        onChange={openSub}
      >
        <AdministrationPageNavigation>
          <AdministrationTabList aria-label={translate('administration_settings_menu_title')} />
        </AdministrationPageNavigation>
        <TabPanelList contents />
      </TabsState>
    </AdministrationPageLayout>
  );
});
