/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionConfig, DatabaseAuthModel } from '@cloudbeaver/core-sdk';

export interface IFormController {
  authModel?: DatabaseAuthModel;
  config: ConnectionConfig;
  isUrlConnection: boolean;
  isConnecting: boolean;
  onChange: <T extends keyof ConnectionConfig>(property: T, value: ConnectionConfig[T]) => void;
}
