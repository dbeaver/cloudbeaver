/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent, type PlaceholderComponent } from '@cloudbeaver/core-blocks';

import type { IServerConfigurationFeatureListProps } from './ServerConfigurationFeatureList.js';

export const ServerConfigurationFeatureList: PlaceholderComponent<IServerConfigurationFeatureListProps> = importLazyComponent(() =>
  import('./ServerConfigurationFeatureList.js').then(m => m.ServerConfigurationFeatureList),
);
