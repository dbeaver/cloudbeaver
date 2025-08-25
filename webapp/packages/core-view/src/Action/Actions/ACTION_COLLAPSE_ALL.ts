/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '../createAction.js';

export const ACTION_COLLAPSE_ALL = createAction('collapse-all', {
  label: 'app_navigationTree_action_collapse_all',
  icon: '/icons/collapse_sm.svg',
});
