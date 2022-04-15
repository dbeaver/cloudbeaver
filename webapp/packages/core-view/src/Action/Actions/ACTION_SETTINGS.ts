/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '../createAction';

export const ACTION_SETTINGS = createAction('settings', {
  label: 'ui_settings',
  tooltip: 'ui_settings',
  icon: '/icons/settings_cog_m.svg',
});
