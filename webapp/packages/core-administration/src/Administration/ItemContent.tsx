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

type Props = {
  activeItemName: string | null;
  activeItemSub: string | null;
  activeItemSubParam: string | null;
  configurationWizard: boolean;
}

export const ItemContent = observer(function ItemContent({
  activeItemName,
  activeItemSub,
  activeItemSubParam,
  configurationWizard,
}: Props) {
  const administrationItemService = useService(AdministrationItemService);

  if (!activeItemName) {
    return null;
  }

  const item = administrationItemService.getItem(activeItemName, configurationWizard);

  if (!item) {
    return null;
  }

  if (activeItemSub) {
    const sub = administrationItemService.getItemSub(item, activeItemSub);
    if (sub) {
      const Component = sub.getComponent ? sub.getComponent() : item.getContentComponent();

      return <Component item={item} sub={sub} param={activeItemSubParam} configurationWizard={configurationWizard} />;
    }
  }

  const Component = item.getContentComponent();

  return <Component item={item} configurationWizard={configurationWizard} />;
});
