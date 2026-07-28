/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { FormState } from '@cloudbeaver/core-ui';

import type { AdministrationAISettingsFormService } from './AdministrationAISettingsFormService.js';

export class AdministrationAISettingsFormState extends FormState<null> {
  constructor(serviceProvider: IServiceProvider, service: AdministrationAISettingsFormService) {
    super(serviceProvider, service, null);
  }
}
