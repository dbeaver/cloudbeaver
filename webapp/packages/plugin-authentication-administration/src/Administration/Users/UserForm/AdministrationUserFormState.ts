/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { App } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import type { AdministrationUserFormService, IUserFormState } from './AdministrationUserFormService';

export class AdministrationUserFormState extends FormState<IUserFormState> {
  constructor(app: App, service: AdministrationUserFormService, config: IUserFormState) {
    super(app, service, config);
  }
}
