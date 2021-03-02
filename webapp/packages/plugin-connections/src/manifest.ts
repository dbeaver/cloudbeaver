/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { PublicConnectionFormBootstrap } from './PublicConnectionForm/PublicConnectionFormBootstrap';
import { PublicConnectionFormService } from './PublicConnectionForm/PublicConnectionFormService';

export const connectionPlugin: PluginManifest = {
  info: {
    name: 'Connection template plugin',
  },

  providers: [
    PublicConnectionFormBootstrap,
    PublicConnectionFormService,
    LocaleService,
  ],
};
