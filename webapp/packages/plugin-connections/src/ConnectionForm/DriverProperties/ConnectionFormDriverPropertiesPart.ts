/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { IConnectionProperties } from '../Options/IConnectionConfig.js';

function getDefaultState(): IConnectionProperties {
  return {};
}

export class ConnectionFormDriverPropertiesPart extends FormPart<IConnectionProperties, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, getDefaultState());
  }

  override isOutdated(): boolean {
    return this.connectionInfoResource.isOutdated(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!));
  }

  protected override async loader(): Promise<void> {
    if (!this.formState.state.config.connectionId || !this.formState.state.projectId) {
      this.setInitialState(getDefaultState());
      return;
    }

    const connection = this.connectionInfoResource.get(
      createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId),
    );

    if (connection?.properties) {
      this.setInitialState({ ...connection.properties });
      return;
    }

    this.setInitialState(getDefaultState());
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {}

  protected override format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void | Promise<void> {
    for (let key of Object.keys(this.state!)) {
      if (typeof this.state[key] === 'string') {
        this.state[key] = this.state[key].trim();
      }
    }
  }
}
