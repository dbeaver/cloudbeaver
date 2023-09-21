/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { AdminConnectionGrantInfo } from '@cloudbeaver/core-sdk';
import type { ILoadableState } from '@cloudbeaver/core-utils';

export interface IUserFormConnectionAccessPart extends ILoadableState {
  grantedConnections: AdminConnectionGrantInfo[];
  selectedConnections: Map<any, boolean>;

  isChanged(): boolean;

  load(): Promise<void>;
  save(): Promise<void>;
}
