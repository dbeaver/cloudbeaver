/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { FC, PropsWithChildren } from 'react';

import { importLazyComponent } from '@cloudbeaver/core-blocks';

import type { IServerConfigurationFeatureGroupProps } from './ServerConfigurationFeatureGroup.js';

export const ServerConfigurationFeatureGroup: FC<PropsWithChildren<IServerConfigurationFeatureGroupProps>> = importLazyComponent(() =>
  import('./ServerConfigurationFeatureGroup.js').then(m => m.ServerConfigurationFeatureGroup),
);
