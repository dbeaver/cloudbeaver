/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ConnectionInfoPropertiesResource, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { runInAction, toJS } from 'mobx';
import type { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';
import { type schema, trimObjectValues } from '@cloudbeaver/core-utils';
import { getObjectPropertyDefaultValue, getObjectPropertyOptionValue, getObjectPropertyValue } from '@cloudbeaver/core-sdk';
import type { CONNECTION_PROPERTIES_SCHEMA } from '../CONNECTION_CONFIG_SCHEMA.js';

type ConnectionProperties = schema.infer<typeof CONNECTION_PROPERTIES_SCHEMA>;

function getDefaultState(): ConnectionProperties {
  return {};
}

export class ConnectionFormDriverPropertiesPart extends FormPart<ConnectionProperties, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoPropertiesResource: ConnectionInfoPropertiesResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, getDefaultState());

    this.optionsPart.onDriverIdChange.addHandler(this.onDriverIdChangeHandler.bind(this));
  }

  private async onDriverIdChangeHandler(driverId: string | undefined) {
    const defaults = await this.getDefaultConfig();
    this.setState(defaults);
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
      const defaults = await this.getDefaultConfig();
      this.setInitialState(defaults);
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

  protected override format(): void {
    runInAction(() => {
      trimObjectValues(this.state);
      trimObjectValues(this.optionsPart.state.properties);
    });
  }

  protected override async prepare(): Promise<void> {
    this.optionsPart.state.properties = await this.getPropertiesConfig();
  }

  private async getPropertiesConfig() {
    const config = toJS(this.state);

    if (!this.optionsPart.state.driverId) {
      return config;
    }

    const properties = await this.connectionInfoResource.getConnectionDriverProperties(this.formState.state.projectId, this.optionsPart.state);

    /*
     * Default property values must not be returned. If they are included in the request, the backend will send them back with
     * modified values (e.g., null converted to an empty string). Only explicitly changed properties should be sent.
     */
    for (const [key, value] of Object.entries(config)) {
      const property = properties?.find(property => property.id === key);
      if (property && value === getObjectPropertyOptionValue(property.defaultValue)) {
        delete config[key];
      }
    }

    return config;
  }

  private async getDefaultConfig() {
    const config: ConnectionProperties = {};
    const properties = await this.connectionInfoResource.getConnectionDriverProperties(this.formState.state.projectId, this.optionsPart.state);

    for (const property of properties) {
      const value = getObjectPropertyValue(property);
      const defaultValue = getObjectPropertyDefaultValue(property);

      /** 
      The backend can override some driver properties by default. These overridden properties will be stored in the value field,
       so we set them here to allow the user to change them or reset them to their default driver values later. 
      */
      if (value && value !== defaultValue && property.id) {
        config[property.id] = value;
      }
    }

    return config;
  }
}
