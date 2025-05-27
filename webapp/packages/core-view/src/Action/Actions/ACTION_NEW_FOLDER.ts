/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '../createAction.js';

export const ACTION_NEW_FOLDER = createAction('create-folder', {
  label: 'core_view_action_new_folder',
  tooltip: 'core_view_action_new_folder',
  icon: '/icons/folder_sm.svg',
});
