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
}

export const ItemContent = observer(function ItemContent({ activeItemName, activeItemSub, activeItemSubParam }: Props) {
  const administrationItemService = useService(AdministrationItemService);

  if (!activeItemName) {
    return null;
  }

  const item = administrationItemService.getItem(activeItemName);

  if (!item) {
    return null;
  }

  if (activeItemSub) {
    const sub = administrationItemService.getItemSub(item, activeItemSub);
    if (sub) {
      const Component = sub.getComponent();

      return <Component item={item} sub={sub} param={activeItemSubParam} />;
    }
  }

  const Component = item.getContentComponent();

  return <Component item={item} />;
});
