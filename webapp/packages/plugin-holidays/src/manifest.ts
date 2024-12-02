/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const holidaysPlugin: PluginManifest = {
  info: {
    name: 'Holidays plugin',
  },
  providers: [
    () => import('./HolidaysService.js').then(m => m.HolidaysService),
    () => import('./Christmas/ChristmasService.js').then(m => m.ChristmasService),
  ],
};
