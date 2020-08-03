/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PluginManifest } from '@cloudbeaver/core-di';

import { SpreadsheetService } from './SpreadsheetService';

export const manifest: PluginManifest = {
  info: { name: 'AgGrid Table' },
  providers: [SpreadsheetService],
};
