/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ConnectionInfoPropertiesResource } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { IConnectionProperties } from '../Options/IConnectionConfig.js';
import { observable, runInAction } from 'mobx';
import type { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';

function getDefaultState(): IConnectionProperties {
  return {};
}

export class ConnectionFormDriverPropertiesPart extends FormPart<IConnectionProperties, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoPropertiesResource: ConnectionInfoPropertiesResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, getDefaultState());

    this.optionsPart.onDriverIdChange.addHandler(this.onDriverIdChangeHandler.bind(this));
  }

  private onDriverIdChangeHandler(driverId: string | undefined) {
    this.reset();
  }

  override isOutdated(): boolean {
    if (!this.optionsPart.connectionKey) {
      return false;
    }

    return this.connectionInfoPropertiesResource.isOutdated(this.optionsPart.connectionKey);
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      this.setInitialState(getDefaultState());
      return;
    }

    const connection = await this.connectionInfoPropertiesResource.load(this.optionsPart.connectionKey);

    this.setInitialState({ ...connection.properties });
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

      if (!this.optionsPart.state.properties) {
        this.optionsPart.state.properties = observable({});
      }

      Object.assign(this.optionsPart.state.properties, this.state);
    });
  }
}
