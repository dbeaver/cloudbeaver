/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AdministrationItemService, type IAdministrationItemRoute } from '@cloudbeaver/core-administration';
import { Loader, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabPanel } from '@cloudbeaver/core-ui';

interface Props {
  activeScreen: IAdministrationItemRoute | null;
  configurationWizard: boolean;
}

export const ItemContent = observer<Props>(function ItemContent({ activeScreen, configurationWizard }) {
  const translate = useTranslate();
  const administrationItemService = useService(AdministrationItemService);

  if (!activeScreen?.item) {
    return <TextPlaceholder>{translate('ui_page_not_found')}</TextPlaceholder>;
  }

  const item = administrationItemService.getItem(activeScreen.item, configurationWizard);

  if (!item) {
    return <TextPlaceholder>{translate('ui_page_not_found')}</TextPlaceholder>;
  }

  if (administrationItemService.itemActivating) {
    return <Loader />;
  }

  if (activeScreen.sub) {
    const sub = administrationItemService.getItemSub(item, activeScreen.sub);
    if (sub) {
      const Component = sub.getComponent ? sub.getComponent() : item.getContentComponent();

      return (
        <TabPanel tabId={activeScreen.item} contents>
          <Component item={item} sub={sub} param={activeScreen.param} configurationWizard={configurationWizard} />
        </TabPanel>
      );
    }
  }

  const Component = item.getContentComponent();

  return (
    <TabPanel tabId={activeScreen.item} contents>
      <Component item={item} configurationWizard={configurationWizard} />
    </TabPanel>
  );
});
