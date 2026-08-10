/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DDL_VIEWER_FULL_DDL = createAction('ddl-viewer-full-ddl', {
  label: 'plugin_ddl_viewer_full_ddl',
  tooltip: 'plugin_ddl_viewer_full_ddl',
  type: 'checkbox',
});
