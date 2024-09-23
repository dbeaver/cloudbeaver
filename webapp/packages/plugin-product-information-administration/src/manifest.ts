/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const productInformationPlugin: PluginManifest = {
  info: { name: 'Product administration plugin' },
  providers: [
    () => import('./ProductInfoService.js').then(m => m.ProductInfoService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./ProductInfoNavigationService.js').then(m => m.ProductInfoNavigationService),
  ],
};
