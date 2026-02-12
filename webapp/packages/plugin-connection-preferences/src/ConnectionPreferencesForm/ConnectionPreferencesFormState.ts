/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import type { IConnectionPreferencesFormState } from './IConnectionPreferencesFormState.js';
import type { ConnectionPreferencesFormService } from './ConnectionPreferencesFormService.js';

export class ConnectionPreferencesFormState extends FormState<IConnectionPreferencesFormState> {
  constructor(serviceProvider: IServiceProvider, service: ConnectionPreferencesFormService, config: IConnectionPreferencesFormState) {
    super(serviceProvider, service, config);
  }
}
