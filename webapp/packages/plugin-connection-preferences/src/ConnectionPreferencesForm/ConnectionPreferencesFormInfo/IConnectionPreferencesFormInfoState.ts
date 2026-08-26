/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { schema } from '@cloudbeaver/core-utils';
import { CONNECTION_CONFIG_SCHEMA } from '@cloudbeaver/plugin-connections';

export const CONNECTION_PREFERENCES_FORM_INFO_STATE_SCHEMA = CONNECTION_CONFIG_SCHEMA.pick({
  name: true,
  folder: true,
  description: true,
  driverId: true,
});

export type IConnectionPreferencesFormInfoState = schema.infer<typeof CONNECTION_PREFERENCES_FORM_INFO_STATE_SCHEMA>;
