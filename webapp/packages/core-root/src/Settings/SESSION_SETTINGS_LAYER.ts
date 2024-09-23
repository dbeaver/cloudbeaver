/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsLayer } from '@cloudbeaver/core-settings';

import { SERVER_SETTINGS_LAYER } from './ServerSettingsService.js';

export const SESSION_SETTINGS_LAYER = createSettingsLayer(SERVER_SETTINGS_LAYER, 'session');
