/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import type { IFormState } from '@cloudbeaver/core-ui';

import { ServerConfigurationFormService } from './ServerConfigurationFormService.js';
import { ServerConfigurationFormState } from './ServerConfigurationFormState.js';
import { getServerConfigurationFormPart } from './getServerConfigurationFormPart.js';

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

  create(): IFormState<null> {
    if (this.formState) {
      return this.formState;
    }

    this.formState = new ServerConfigurationFormState(this.serviceProvider, this.serverConfigurationFormService);
    return this.formState;
  }

  async save(): Promise<boolean> {
    if (!this.formState) {
      return false;
    }

    const part = getServerConfigurationFormPart(this.formState);
    const supportedHostsChanged = part.state.serverConfig.supportedHosts !== part.initialState.serverConfig.supportedHosts;
    const saved = await this.formState.save();

    if (!saved) {
      return false;
    }

    if (supportedHostsChanged) {
      location.reload();
    }

    return true;
  }

  destroy(): void {
    if (this.formState) {
      this.formState?.dispose();
      this.formState = null;
    }
  }
}
