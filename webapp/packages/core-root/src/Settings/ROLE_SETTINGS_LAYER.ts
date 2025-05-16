/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsLayer } from '@cloudbeaver/core-settings';
import { TEAM_SETTINGS_LAYER } from './TEAM_SETTINGS_LAYER.js';

export const ROLE_SETTINGS_LAYER = createSettingsLayer(TEAM_SETTINGS_LAYER, 'role');
