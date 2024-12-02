/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon } from '@cloudbeaver/core-blocks';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { TOP_NAV_BAR_SETTINGS_MENU } from './TOP_NAV_BAR_SETTINGS_MENU.js';

export const SettingsMenu = observer(function SettingsMenu() {
  const menu = useMenu({ menu: TOP_NAV_BAR_SETTINGS_MENU });

  return (
    <ContextMenu menu={menu} placement="bottom-end" modal rtl>
      <Icon name="settings" viewBox="0 0 28 28" />
    </ContextMenu>
  );
});
