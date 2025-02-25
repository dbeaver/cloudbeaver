/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { DBDriverResource } from '@cloudbeaver/core-connections';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import type { IConnectionFormStateRefactored } from '../IConnectionFormStateRefactored.js';

export class ConnectionFormDriverPropertiesPart extends FormPart<void, IConnectionFormStateRefactored> {
  constructor(
    formState: IFormState<IConnectionFormStateRefactored>,
    private readonly dbDriverResource: DBDriverResource,
  ) {
    super(formState);
  }

  protected override async loader(): Promise<void> {}

  protected override async saveChanges(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {}

  protected override format(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): void | Promise<void> {
    const driverId = this.formState.state.driverId;
    const config = getConnectionFormOptionsPart(this.formState).state;

    if (!config.properties) {
      config.properties = {};
    }

    if (driverId) {
      const driver = this.dbDriverResource.get(driverId);
      const defaultDriverProperties = new Set(driver?.driverProperties?.map(property => property.id) ?? []);

      for (let key of Object.keys(config.properties)) {
        const value = config.properties[key];
        if (!defaultDriverProperties?.has(key)) {
          key = key.trim();
        }

        config.properties[key] = typeof value === 'string' ? value.trim() : value;
      }
    }
  }
}
