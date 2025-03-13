/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ConnectionInfoResource, createConnectionParam, type DBDriverResource } from '@cloudbeaver/core-connections';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { IConnectionProperties } from '../Options/IConnectionConfig.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const getDefaultState = (): IConnectionProperties => ({});

export class ConnectionFormDriverPropertiesPart extends FormPart<IConnectionProperties, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, getDefaultState());
  }

  protected override async loader(): Promise<void> {
    if (!this.formState.state.config.connectionId || !this.formState.state.projectId) {
      this.setInitialState(getDefaultState());
      return;
    }

    const connection = this.connectionInfoResource.get(
      createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId),
    );

    this.setInitialState(connection?.properties ?? getDefaultState());
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {}

  protected override format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void | Promise<void> {
    const driverId = this.formState.state.config.driverId;
    const optionsPart = getConnectionFormOptionsPart(this.formState);

    if (driverId) {
      const driver = this.dbDriverResource.get(driverId);
      const trimmedProperties: IConnectionProperties = {};
      const defaultDriverProperties = new Set(driver?.driverProperties?.map(property => property.id) ?? []);

      for (let key of Object.keys(this.state!)) {
        const value = this.state![key];
        if (!defaultDriverProperties?.has(key)) {
          key = key.trim();
        }

        trimmedProperties[key] = typeof value === 'string' ? value.trim() : value;
      }

      this.state = trimmedProperties;
      optionsPart.state.properties = {
        ...optionsPart.state.properties,
        ...this.state,
      };
    }
  }
}
