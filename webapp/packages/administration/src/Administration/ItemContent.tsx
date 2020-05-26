/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useService } from '@dbeaver/core/di';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';

type Props = {
  activeItemName: string | null;
}

export const ItemContent = observer(function ItemContent({ activeItemName }: Props) {
  const administrationItemService = useService(AdministrationItemService);

  if (!activeItemName) {
    return null;
  }

  const item = administrationItemService.getItem(activeItemName);
  const Component = item.getContentComponent();

  return <Component item={item} />;
});
