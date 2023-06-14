/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '../localization/useTranslate';
import { MenuItem } from './MenuItem';
import { MenuItemElement } from './MenuItemElement';

export const MenuEmptyItem = observer(function MenuEmptyItem() {
  const translate = useTranslate();

  const label = translate('core_ui_empty');

  return (
    <MenuItem id="empty" aria-label={label} disabled>
      <MenuItemElement label={label} />
    </MenuItem>
  );
});
