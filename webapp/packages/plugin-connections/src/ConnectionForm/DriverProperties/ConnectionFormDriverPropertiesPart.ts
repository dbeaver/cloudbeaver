/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CONNECTION_PROPERTIES_SCHEMA, ConnectionInfoPropertiesResource, DBDriverResource } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { runInAction, toJS } from 'mobx';
import type { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';
import type { schema } from '@cloudbeaver/core-utils';
import { getObjectPropertyOptionValue } from '@cloudbeaver/core-sdk';

type ConnectionProperties = schema.infer<typeof CONNECTION_PROPERTIES_SCHEMA>;

function getDefaultState(): ConnectionProperties {
  return {};
}

export class ConnectionFormDriverPropertiesPart extends FormPart<ConnectionProperties, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoPropertiesResource: ConnectionInfoPropertiesResource,
    private readonly dbDriverResource: DBDriverResource,
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

  protected override setState(state: Record<string, any>): void {
    super.setState(state);
    this.optionsPart.state.properties = this.state;
  }

  protected override setInitialState(initialState: Record<string, any>): void {
    super.setInitialState(initialState);
    this.optionsPart.initialState.properties = initialState;
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      this.setInitialState(getDefaultState());
      return;
    }

    const connection = await this.connectionInfoPropertiesResource.load(this.optionsPart.connectionKey);
    const properties = toJS(connection.properties);

    this.setInitialState(properties);
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {}

  protected override async format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    runInAction(() => {
      for (const key of Object.keys(this.state!)) {
        if (typeof this.state[key] === 'string') {
          this.state[key] = this.state[key].trim();
        }
      }
    });

    this.optionsPart.state.properties = await this.getPropertiesConfig();
  }

  private async getPropertiesConfig() {
    const config = toJS(this.state);

    if (!this.optionsPart.state.driverId) {
      return config;
    }

    const properties = await this.dbDriverResource.load(this.optionsPart.state.driverId, ['includeDriverProperties']);

    /* Default property values must not be returned. If they are included in the request, the backend will send them back with modified values (e.g., null converted to an empty string).
    To avoid this behavior, only properties that were explicitly changed should be sent. Any properties that still contain default values must be removed from the object before sending the request
    */
    for (const [key, value] of Object.entries(config)) {
      const property = properties?.driverProperties.find(property => property.id === key);
      if (property && value === getObjectPropertyOptionValue(property.defaultValue)) {
        delete config[key];
      }
    }

    return config;
  }
}
