/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import { ConnectionFormService } from './ConnectionFormService.js';
import type { IConnectionFormState } from './IConnectionFormState.js';

export class ConnectionFormState extends FormState<IConnectionFormState> {
  constructor(serviceProvider: IServiceProvider, service: ConnectionFormService, config: IConnectionFormState) {
    super(serviceProvider, service, config);
  }
}
