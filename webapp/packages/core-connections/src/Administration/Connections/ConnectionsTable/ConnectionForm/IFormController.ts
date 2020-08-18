/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DBDriver } from '@cloudbeaver/core-connections';
import { ConnectionConfig, DatabaseAuthModel } from '@cloudbeaver/core-sdk';

import { ConnectionType } from '../ConnectionEditController';

export interface IFormController {
  isSearched: boolean;
  isNew: boolean;
  connectionId: string;
  drivers: DBDriver[];
  driver: DBDriver | null;
  authModel: DatabaseAuthModel | null;
  config: ConnectionConfig;
  connectionType: ConnectionType;
  isSaving: boolean;
  isDisabled: boolean;
  onChangeType(type: ConnectionType): void;
  onSelectDriver(driver: DBDriver): void;
  onChange<T extends keyof ConnectionConfig>(property: T, value: ConnectionConfig[T]): void;
}
