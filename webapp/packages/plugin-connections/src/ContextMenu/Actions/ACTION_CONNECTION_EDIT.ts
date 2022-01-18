/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_CONNECTION_EDIT = createAction(
  'connection-edit',
  {
    label: 'connections_public_connection_edit_menu_item_title',
  }
);
