/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DatabaseAuthModelsResource, DatabaseConnection, DBDriverResource, isJDBCConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, isObjectPropertyInfoStateEqual, ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { getUniqueName, isValuesEqual } from '@cloudbeaver/core-utils';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext';
import { ConnectionFormService } from '../ConnectionFormService';
import { connectionConfigContext } from '../Contexts/connectionConfigContext';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext';
import { connectionFormStateContext } from '../Contexts/connectionFormStateContext';
import type { IConnectionFormSubmitData, IConnectionFormFillConfigData, IConnectionFormState } from '../IConnectionFormProps';
import { Options } from './Options';

@injectable()
export class ConnectionOptionsTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
  ) {
    super();
  }

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'options',
      name: 'customConnection_options',
      order: 1,
      panel: () => Options,
    });

    this.connectionFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formValidationTask
      .addHandler(this.validate.bind(this));

    this.connectionFormService.formSubmittingTask
      .addHandler(this.save.bind(this));

    this.connectionFormService.formStateTask
      .addHandler(this.formState.bind(this));

    this.connectionFormService.configureTask
      .addHandler(this.configure.bind(this));

    this.connectionFormService.fillConfigTask
      .addHandler(this.fillConfig.bind(this));
  }

  load(): void { }

  private async save(
    {
      state,
      submitType,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const status = contexts.getContext(this.connectionFormService.connectionStatusContext);
    const config = contexts.getContext(connectionConfigContext);

    try {
      if (submitType === 'submit') {
        if (state.mode === 'edit') {
          const connection = await state.resource.update(config);
          status.info('Connection was updated');
          status.info(connection.name);
        } else {
          const connection = await state.resource.create(config);
          config.connectionId = connection.id;
          status.info('Connection was created');
          status.info(connection.name);
        }
      } else {
        const info = await state.resource.test(config);
        status.info('Connection is established');
        status.info('Client version: ' + info.clientVersion);
        status.info('Server version: ' + info.serverVersion);
        status.info('Connection time: ' + info.connectTime);
      }
    } catch (exception) {
      if (submitType === 'submit') {
        status.error('connections_connection_create_fail', exception);
      } else {
        status.error('connections_connection_test_fail', exception);
      }
    }
  }

  private async validate(
    {
      state,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const validation = contexts.getContext(this.connectionFormService.connectionValidationContext);

    if (!state.config.name?.length) {
      validation.error("Field 'name' can't be empty");
    }
  }

  private fillConfig(
    { state, updated }: IConnectionFormFillConfigData,
    contexts: IExecutionContextProvider<IConnectionFormFillConfigData>
  ) {
    if (!updated) {
      return;
    }

    if (!state.config.credentials || updated) {
      state.config.credentials = {};
      state.config.saveCredentials = false;
    }

    if (!state.config.providerProperties || updated) {
      state.config.providerProperties = {};
    }

    if (!state.info) {
      return;
    }

    state.config.connectionId = state.info.id;

    state.config.name = state.info.name;
    state.config.description = state.info.description;
    state.config.template = state.info.template;
    state.config.driverId = state.info.driverId;

    state.config.host = state.info.host;
    state.config.port = state.info.port;
    state.config.databaseName = state.info.databaseName;
    state.config.url = state.info.url;

    state.config.authModelId = state.info.authModel;
    state.config.saveCredentials = state.info.saveCredentials;

    if (state.info.authProperties) {
      for (const property of state.info.authProperties) {
        if (!property.features.includes('password')) {
          state.config.credentials[property.id!] = property.value;
        }
      }
    }

    if (state.info.providerProperties) {
      state.config.providerProperties = { ...state.info.providerProperties };
    }
  }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeAuthProperties');
  }

  private async prepareConfig(
    {
      state,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(connectionConfigContext);
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);

    if (!state.config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(state.config.driverId, ['includeProviderProperties']);

    if (state.mode === 'edit') {
      config.connectionId = state.config.connectionId;
    }

    config.name = state.config.name?.trim();

    if (config.name && state.mode === 'create') {
      const connections = await state.resource.load(CachedMapAllKey);
      const connectionNames = connections.map(connection => connection.name);
      config.name = getUniqueName(config.name, connectionNames);
    }

    config.description = state.config.description;
    config.template = state.config.template;
    config.driverId = state.config.driverId;

    if (isJDBCConnection(driver, state.info)) {
      config.url = state.config.url;
    } else {
      if (!driver.embedded) {
        config.host = state.config.host;
        config.port = state.config.port;
      }
      config.databaseName = state.config.databaseName;
    }

    if (state.config.authModelId || driver.defaultAuthModel) {
      config.authModelId = state.config.authModelId || driver.defaultAuthModel;
      config.saveCredentials = state.config.saveCredentials;

      const properties = await this.getConnectionAuthModelProperties(config.authModelId, state.info);

      if (this.isCredentialsChanged(properties, state.config.credentials)) {
        config.credentials = { ...state.config.credentials };
      }

      if (!config.saveCredentials) {
        credentialsState.requireAuthModel(config.authModelId);
      }
    }

    if (driver.providerProperties.length > 0) {
      const providerProperties: Record<string, any> = { ...state.config.providerProperties };

      for (const providerProperty of driver.providerProperties) {
        if (providerProperty.defaultValue === null
          || providerProperty.defaultValue === undefined
          || !providerProperty.id
          || providerProperty.id in providerProperties) {
          continue;
        }

        providerProperties[providerProperty.id] = providerProperty.defaultValue;
      }

      config.providerProperties = providerProperties;
    }
  }

  private async formState(
    data: IConnectionFormState,
    contexts: IExecutionContextProvider<IConnectionFormState>
  ) {
    if (!data.info) {
      return;
    }

    const config = contexts.getContext(connectionConfigContext);
    const stateContext = contexts.getContext(connectionFormStateContext);
    const driver = await this.dbDriverResource.load(data.config.driverId!, ['includeProviderProperties']);

    if (
      !isValuesEqual(config.name, data.info.name, '')
      || !isValuesEqual(config.description, data.info.description, '')
      || !isValuesEqual(config.template, data.info.template, true)
      || !isValuesEqual(config.driverId, data.info.driverId, '')
      || (config.url !== undefined && !isValuesEqual(config.url, data.info.url, ''))
      || (config.host !== undefined && !isValuesEqual(config.host, data.info.host, ''))
      || (config.port !== undefined && !isValuesEqual(config.port, data.info.port, ''))
      || (config.databaseName !== undefined && !isValuesEqual(config.databaseName, data.info.databaseName, ''))
      || config.credentials !== undefined
      || (config.authModelId !== undefined && !isValuesEqual(config.authModelId, data.info.authModel, ''))
      || (config.saveCredentials !== undefined && config.saveCredentials !== data.info.saveCredentials)
      || (
        config.providerProperties !== undefined
        && !isObjectPropertyInfoStateEqual(
          driver.providerProperties,
          config.providerProperties,
          data.info.providerProperties
        )
      )
    ) {
      stateContext.markEdited();
    }
  }

  private isCredentialsChanged(
    authProperties: ObjectPropertyInfo[],
    credentials: Record<string, any>
  ) {
    for (const property of authProperties) {
      const value = credentials[property.id!];

      if (property.features.includes('password')) {
        if (value) {
          return true;
        }
      } else if (value !== property.value) {
        return true;
      }
    }
    return false;
  }

  private async getConnectionAuthModelProperties(
    authModelId: string,
    connectionInfo?: DatabaseConnection
  ): Promise<ObjectPropertyInfo[]> {
    const authModel = await this.databaseAuthModelsResource.load(authModelId);

    let properties = authModel.properties;

    if (connectionInfo?.authProperties && connectionInfo.authProperties.length > 0) {
      properties = connectionInfo.authProperties;
    }

    return properties;
  }
}
