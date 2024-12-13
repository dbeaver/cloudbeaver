/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_EDITING_DELETE_SELECTED_ROW = createAction('data-grid-editing-delete-selected-row', {
  label: 'data_viewer_action_edit_delete',
  icon: '/icons/data_delete_sm.svg',
});
