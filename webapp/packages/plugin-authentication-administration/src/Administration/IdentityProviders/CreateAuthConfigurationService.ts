/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { AuthConfigurationsResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';

import { AuthConfigurationFormService } from './AuthConfigurationFormService';
import { AuthConfigurationFormState } from './AuthConfigurationFormState';
import { AuthConfigurationsAdministrationNavService } from './AuthConfigurationsAdministrationNavService';
import type { IAuthConfigurationFormState } from './IAuthConfigurationFormProps';

@injectable()
export class CreateAuthConfigurationService {
  disabled = false;
  data: IAuthConfigurationFormState | null;

  constructor(
    private readonly authConfigurationsAdministrationNavService: AuthConfigurationsAdministrationNavService,
    private readonly authConfigurationFormService: AuthConfigurationFormService,
    private readonly authConfigurationsResource: AuthConfigurationsResource
  ) {
    this.data = null;

    this.cancelCreate = this.cancelCreate.bind(this);
    this.create = this.create.bind(this);

    makeObservable(this, {
      data: observable,
      disabled: observable,
    });
  }

  cancelCreate(): void {
    this.authConfigurationsAdministrationNavService.navToRoot();
  }

  fillData(): void {
    this.data = new AuthConfigurationFormState(
      this.authConfigurationFormService,
      this.authConfigurationsResource
    );
  }

  create(): void {
    this.authConfigurationsAdministrationNavService.navToCreate();
  }
}
