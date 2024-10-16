/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { formValidationContext } from '@cloudbeaver/core-ui';

import type { IServerConfigurationFormPartState } from './IServerConfigurationFormPartState.js';
import { ServerConfigurationFormService } from './ServerConfigurationFormService.js';

export interface IConfigurationPlaceholderProps {
  configurationWizard: boolean;
  state: IServerConfigurationFormPartState;
}

@injectable()
export class ServerConfigurationService {
  isDone: boolean;

  readonly configurationContainer: PlaceholderContainer<IConfigurationPlaceholderProps>;
  readonly pluginsContainer: PlaceholderContainer<IConfigurationPlaceholderProps>;

  constructor(private readonly serverConfigurationFormService: ServerConfigurationFormService) {
    this.isDone = false;
    this.configurationContainer = new PlaceholderContainer();
    this.pluginsContainer = new PlaceholderContainer();

    this.serverConfigurationFormService.onValidate.addHandler((data, contexts) => {
      const validation = contexts.getContext(formValidationContext);
      this.setDone(validation.valid);
    });

    makeObservable(this, {
      isDone: observable.ref,
    });
  }

  setDone(value: boolean) {
    this.isDone = value;
  }
}
