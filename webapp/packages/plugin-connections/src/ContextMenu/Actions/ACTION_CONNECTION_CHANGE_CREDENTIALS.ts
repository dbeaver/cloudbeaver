/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_CONNECTION_CHANGE_CREDENTIALS = createAction('connection-change-credentials', {
  label: 'app_navigationTree_context_change_credentials',
});
