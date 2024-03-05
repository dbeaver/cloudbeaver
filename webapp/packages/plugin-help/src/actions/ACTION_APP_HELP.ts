/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_APP_HELP = createAction('app-help', {
  label: 'shortcuts_title',
  tooltip: 'shortcuts_title',
  icon: '/icons/plugin_help_m.svg',
});
