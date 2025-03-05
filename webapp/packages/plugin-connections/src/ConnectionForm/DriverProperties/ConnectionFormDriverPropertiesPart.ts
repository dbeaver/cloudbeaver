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
import type { IConnectionFormStateRefactored } from '../IConnectionFormStateRefactored.js';
import type { IConnectionProperties } from '../Options/IConnectionConfig.js';

export class ConnectionFormDriverPropertiesPart extends FormPart<IConnectionProperties, IConnectionFormStateRefactored> {
  constructor(
    formState: IFormState<IConnectionFormStateRefactored>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, {});
  }

  protected override async loader(): Promise<void> {
    if (!this.formState.state.config.connectionId || !this.formState.state.projectId) {
      this.setInitialState({});
      return;
    }

    const connection = await this.connectionInfoResource.load(
      createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId),
    );

    this.setInitialState(connection?.properties ?? {});
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {
    await this.connectionInfoResource.update(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!), {
      connectionId: this.formState.state.config.connectionId,
      properties: this.state,
    });
  }

  protected override format(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): void | Promise<void> {
    const driverId = this.formState.state.config.driverId;

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
    }
  }
}
