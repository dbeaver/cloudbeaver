/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { createConnectionParam, type ConnectionInfoResource } from '@cloudbeaver/core-connections';

import type { IConnectionPreferencesFormState } from '../IConnectionPreferencesFormState.js';
import type { IConnectionPreferencesFormInfoState } from './IConnectionPreferencesFormInfoState.js';

function getInitialState(): IConnectionPreferencesFormInfoState {
  return {};
}

export class ConnectionPreferencesFormInfoPart extends FormPart<IConnectionPreferencesFormInfoState, IConnectionPreferencesFormState> {
  constructor(
    formState: IFormState<IConnectionPreferencesFormState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, getInitialState());
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode === 'edit' && this.formState.state) {
      const key = createConnectionParam(this.formState.state.projectId, this.formState.state.connectionId);

      // probably should implement a separate method as we can load only public accessible connection info here (not implemeted on the backend yet)
      const connection = await this.connectionInfoResource.load(key);

      this.setInitialState({
        driverId: connection.driverId,
        name: connection.name,
        folder: connection.folder,
        description: connection.description,
      });

      return;
    }

    this.setInitialState(getInitialState());
  }

  protected override async saveChanges(): Promise<void> {}
}
