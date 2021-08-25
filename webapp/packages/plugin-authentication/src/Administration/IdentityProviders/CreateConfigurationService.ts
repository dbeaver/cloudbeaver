/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { AuthProviderConfigurationsResource } from './AuthProviderConfigurationsResource';
import { ConfigurationFormService } from './ConfigurationFormService';
import { ConfigurationFormState } from './ConfigurationFormState';
import { ConfigurationsAdministrationNavService } from './ConfigurationsAdministrationNavService';
import type { IConfigurationFormState } from './IConfigurationFormProps';

@injectable()
export class CreateConfigurationService {
  disabled = false;
  data: IConfigurationFormState | null;

  constructor(
    private readonly configurationsAdministrationNavService: ConfigurationsAdministrationNavService,
    private readonly configurationFormService: ConfigurationFormService,
    private readonly authproviderConfigurationsResource: AuthProviderConfigurationsResource
  ) {
    makeObservable(this, {
      data: observable,
      disabled: observable,
    });

    this.data = null;

    this.cancelCreate = this.cancelCreate.bind(this);
    this.create = this.create.bind(this);
  }

  cancelCreate(): void {
    this.configurationsAdministrationNavService.navToRoot();
  }

  fillData(): void {
    this.data = new ConfigurationFormState(
      this.configurationFormService,
      this.authproviderConfigurationsResource
    );
  }

  create(): void {
    this.configurationsAdministrationNavService.navToCreate();
  }
}
