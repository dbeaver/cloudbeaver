/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_COMMIT_MODE_TOGGLE = createAction('commit-mode-toggle', {
  label: 'plugin_datasource_commit_mode_switch_to_manual_commit_mode',
  tooltip: 'plugin_datasource_commit_mode_switch_to_manual_commit_mode',
  icon: '/icons/commit_mode_auto.png',
});
