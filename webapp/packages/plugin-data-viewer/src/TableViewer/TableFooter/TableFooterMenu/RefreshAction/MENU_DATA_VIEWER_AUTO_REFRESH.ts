/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ACTION_REFRESH, createMenu } from '@cloudbeaver/core-view';

export const MENU_DATA_VIEWER_AUTO_REFRESH = createMenu('auto-refresh', 'Auto-Refresh', undefined, 'data_viewer_action_auto_refresh', ACTION_REFRESH);
