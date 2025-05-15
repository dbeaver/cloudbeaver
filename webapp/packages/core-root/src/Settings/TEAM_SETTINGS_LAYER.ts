/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsLayer } from '@cloudbeaver/core-settings';
import { USER_SETTINGS_LAYER } from './USER_SETTINGS_LAYER.js';

export const TEAM_SETTINGS_LAYER = createSettingsLayer(USER_SETTINGS_LAYER, 'team');
