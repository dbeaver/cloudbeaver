/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import type { ConnectionFormServiceRefactored, IConnectionFormRefactoredState } from './ConnectionFormServiceRefactored.js';

export class ConnectionFormStateRefactored extends FormState<IConnectionFormRefactoredState> {
  constructor(serviceProvider: IServiceProvider, service: ConnectionFormServiceRefactored, config: IConnectionFormRefactoredState) {
    super(serviceProvider, service, config);
  }
}
