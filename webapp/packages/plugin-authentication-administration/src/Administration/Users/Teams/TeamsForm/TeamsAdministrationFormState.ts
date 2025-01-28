/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import type { ITeamFormState, TeamsAdministrationFormService } from './TeamsAdministrationFormService.js';

export class TeamsAdministrationFormState extends FormState<ITeamFormState> {
  constructor(serviceProvider: IServiceProvider, service: TeamsAdministrationFormService, config: ITeamFormState) {
    super(serviceProvider, service, config);
  }
}
