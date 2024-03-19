/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATASOURCE_TRANSACTION_COMMIT_MODE_TOGGLE = createAction('datasource-transaction-commit-mode-toggle', {
  label: 'plugin_datasource_transaction_manager_commit_mode_switch_to_manual',
  tooltip: 'plugin_datasource_transaction_manager_commit_mode_switch_to_manual',
  icon: '/icons/commit_mode_auto_m.svg',
});
