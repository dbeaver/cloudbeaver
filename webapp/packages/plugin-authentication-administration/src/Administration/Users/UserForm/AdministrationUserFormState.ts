/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import type { AdministrationUserFormService, IUserFormState } from './AdministrationUserFormService.js';

export class AdministrationUserFormState extends FormState<IUserFormState> {
  constructor(serviceProvider: IServiceProvider, service: AdministrationUserFormService, config: IUserFormState) {
    super(serviceProvider, service, config);
  }
}
