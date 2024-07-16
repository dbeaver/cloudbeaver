/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const productInfoPlugin: PluginManifest = {
  info: { name: 'Product administration plugin' },
  providers: [
    () => import('./ProductInfoService').then(m => m.ProductInfoService),
    () => import('./ProductInfoBootstrap').then(m => m.ProductInfoBootstrap),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./ProductInfoNavigationService').then(m => m.ProductInfoNavigationService),
  ],
};
