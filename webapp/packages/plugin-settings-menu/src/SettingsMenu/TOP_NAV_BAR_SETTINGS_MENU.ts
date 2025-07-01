/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createMenu } from '@cloudbeaver/core-view';

export const TOP_NAV_BAR_SETTINGS_MENU = createMenu('top-nav-bar-settings', {
  label: 'ui_settings',
  icon: '/icons/plugin_settings_menu_m.svg',
  tooltip: 'ui_settings',
});
