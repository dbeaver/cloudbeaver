/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ROOT_SETTINGS_GROUP } from '@cloudbeaver/core-settings';

const CONNECTIONS_SETTINGS_GROUP_ORDER = 3;
export const CONNECTIONS_SETTINGS_GROUP = ROOT_SETTINGS_GROUP.createSubGroup(
  'core_connections_connections_settings_group',
  CONNECTIONS_SETTINGS_GROUP_ORDER,
);
