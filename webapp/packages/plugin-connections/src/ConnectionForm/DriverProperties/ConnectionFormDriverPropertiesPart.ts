/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { IConnectionProperties } from '../Options/IConnectionConfig.js';
import { runInAction } from 'mobx';
import type { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';

function getDefaultState(): IConnectionProperties {
  return {};
}

export class ConnectionFormDriverPropertiesPart extends FormPart<IConnectionProperties, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, getDefaultState());
  }

  override isOutdated(): boolean {
    return this.optionsPart.isOutdated();
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      this.setInitialState(getDefaultState());
      return;
    }

    const connection = this.connectionInfoResource.get(this.optionsPart.connectionKey);

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
    runInAction(() => {
      for (const key of Object.keys(this.state!)) {
        if (typeof this.state[key] === 'string') {
          this.state[key] = this.state[key].trim();
        }
      }

      this.optionsPart.state.properties = {
        ...this.optionsPart.state.properties,
        ...this.state,
      };
    });
  }
}
