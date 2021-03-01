/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { AdminConnectionGrantInfo } from '@cloudbeaver/core-sdk';

export interface IConnectionAccessTabState {
  loading: boolean;
  loaded: boolean;
  selectedSubjects: Map<string, boolean>;
  grantedSubjects: AdminConnectionGrantInfo[];
}
