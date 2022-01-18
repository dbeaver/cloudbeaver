/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { ProductBootstrap } from './ProductBootstrap';

export const productPlugin: PluginManifest = {
  info: { name: 'Product plugin' },
  providers: [ProductBootstrap, LocaleService],
};
