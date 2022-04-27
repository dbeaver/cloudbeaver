/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_OPEN_SCRIPT_IN_CURRENT_TAB = createAction('open-script-in-current-tab', {
  label: 'plugin_resource_manager_open_script_in_current_tab',
});