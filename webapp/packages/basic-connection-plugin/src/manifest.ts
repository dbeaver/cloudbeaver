/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PluginManifest } from '@dbeaver/core/di';

import { BasicConnectionService } from './BasicConnectionService';

export const basicConnectionPluginManifest: PluginManifest = {
  info: {
    name: 'Basic connection plugin',
  },

  providers: [
    BasicConnectionService,
  ],
};
