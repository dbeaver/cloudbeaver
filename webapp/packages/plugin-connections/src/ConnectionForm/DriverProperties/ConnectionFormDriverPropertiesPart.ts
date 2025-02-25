/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { type IConnectionFormRefactoredState } from '../ConnectionFormServiceRefactored.js';
import type { IConnectionFromDriverPropertiesState } from './IConnectionFromDriverPropertiesState.js';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { ConnectionInfoResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const getDefaultState = () =>
  ({
    properties: {},
  }) as IConnectionFromDriverPropertiesState;

export class ConnectionFormDriverPropertiesPart extends FormPart<IConnectionFromDriverPropertiesState, IConnectionFormRefactoredState> {
  constructor(
    formState: IFormState<IConnectionFormRefactoredState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly dbDriverResource: DBDriverResource,
  ) {
    super(formState, getDefaultState());
  }

  protected override async loader(): Promise<void> {
    const info = await this.connectionInfoResource.load({
      connectionId: this.formState.state.connectionInfoParams.connectionId,
      projectId: this.formState.state.connectionInfoParams.projectId,
    });

    this.setInitialState({
      properties: info?.properties,
    });
  }

  protected override saveChanges(
    data: IFormState<IConnectionFormRefactoredState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormRefactoredState>>,
  ): Promise<void> {
    return Promise.resolve();
  }

  protected override format(
    data: IFormState<IConnectionFormRefactoredState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormRefactoredState>>,
  ): void | Promise<void> {
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const config = optionsPart.state.connectionConfig;

    // TODO move driverId to formState
    if (config.driverId) {
      const driver = this.dbDriverResource.get(config.driverId);
      const defaultDriverProperties = new Set(driver?.driverProperties?.map(property => property.id) ?? []);

      for (let key of Object.keys(this.state.properties)) {
        const value = this.state.properties[key];
        if (!defaultDriverProperties?.has(key)) {
          key = key.trim();
        }

        this.state.properties[key] = typeof value === 'string' ? value.trim() : value;
      }

      config.properties = { ...this.state.properties };
    }
  }
}
