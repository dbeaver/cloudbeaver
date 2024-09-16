/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable, IServiceProvider } from '@cloudbeaver/core-di';

import { ServerConfigurationFormService } from './ServerConfigurationFormService';
import { ServerConfigurationFormState } from './ServerConfigurationFormState';

@injectable()
export class ServerConfigurationFormStateManager {
  formState: ServerConfigurationFormState | null;

  constructor(
    private readonly serviceProvider: IServiceProvider,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
  ) {
    this.formState = null;

    makeObservable(this, {
      formState: observable.ref,
    });
  }

  create() {
    if (this.formState) {
      return this.formState;
    }

    this.formState = new ServerConfigurationFormState(this.serviceProvider, this.serverConfigurationFormService);
    return this.formState;
  }

  destroy() {
    if (this.formState) {
      this.formState = null;
    }
  }
}
