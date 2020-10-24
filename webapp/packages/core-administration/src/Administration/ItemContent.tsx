/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useService } from '@cloudbeaver/core-di';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';
import { IAdministrationItemRoute } from '../AdministrationItem/IAdministrationItemRoute';

interface Props {
  activeScreen: IAdministrationItemRoute | null;
  configurationWizard: boolean;
}

export const ItemContent: React.FC<Props> = observer(function ItemContent({
  activeScreen,
  configurationWizard,
}) {
  const administrationItemService = useService(AdministrationItemService);

  if (!activeScreen?.item) {
    return null;
  }

  const item = administrationItemService.getItem(activeScreen.item, configurationWizard);

  if (!item) {
    return null;
  }

  if (activeScreen.sub) {
    const sub = administrationItemService.getItemSub(item, activeScreen.sub);
    if (sub) {
      const Component = sub.getComponent ? sub.getComponent() : item.getContentComponent();

      return <Component item={item} sub={sub} param={activeScreen.param} configurationWizard={configurationWizard} />;
    }
  }

  const Component = item.getContentComponent();

  return <Component item={item} configurationWizard={configurationWizard} />;
});
