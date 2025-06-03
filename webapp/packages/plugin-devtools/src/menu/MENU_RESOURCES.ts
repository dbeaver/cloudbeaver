/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createMenu } from '@cloudbeaver/core-view';

export const MENU_RESOURCES = createMenu('resources-list', {
  label: 'Resources',
  tooltip: 'List of registered resources',
});
