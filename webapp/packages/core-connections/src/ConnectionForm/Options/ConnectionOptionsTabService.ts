/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { isPropertiesEqual } from '@cloudbeaver/core-utils';

import { ConnectionsResource, DatabaseConnection } from '../../Administration/ConnectionsResource';
import { ConnectionInfoResource } from '../../ConnectionInfoResource';
import { DatabaseAuthModelsResource } from '../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../DBDriverResource';
import { getUniqueConnectionName } from '../../getUniqueConnectionName';
import { isJDBCConnection } from '../../isJDBCConnection';
import { connectionConfigContext } from '../connectionConfigContext';
import { IConnectionFormSubmitData, ConnectionFormService, IConnectionFormState } from '../ConnectionFormService';
import { connectionFormStateContext } from '../connectionFormStateContext';
import { Options } from './Options';

@injectable()
export class ConnectionOptionsTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly connectionsResource: ConnectionsResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
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
      if (state.type === 'admin') {
        if (submitType === 'submit') {
          if (state.mode === 'edit') {
            const connection = await this.connectionsResource.update(config.connectionId!, config);
            status.info('Connection updated');
            status.info(connection.name);
          } else {
            const connection = await this.connectionsResource.create(config);
            config.connectionId = connection.id;
            status.info('Connection created');
            status.info(connection.name);
          }
        } else {
          const info = await this.connectionsResource.test(config);
          status.info('Connection is established');
          status.info('Client version: ' + info.clientVersion);
          status.info('Server version: ' + info.serverVersion);
          status.info('Connection time: ' + info.connectTime);
        }
      } else {
        if (submitType === 'submit') {
          if (state.mode === 'edit') {
            const connection = await this.connectionInfoResource.update(config);
            status.info('Connection updated');
            status.info(connection.name);
          } else {
            const connection = await this.connectionInfoResource.createConnection(config);
            config.connectionId = connection.id;
            status.info('Connection created');
            status.info(connection.name);
          }
        } else {
          const info = await this.connectionInfoResource.testConnection(config);
          status.info('Connection is established');
          status.info('Client version: ' + info.clientVersion);
          status.info('Server version: ' + info.serverVersion);
          status.info('Connection time: ' + info.connectTime);
        }
      }
    } catch (exception) {
      if (submitType === 'submit') {
        status.error('connections_connection_create_fail', exception);
      } else {
        status.error('connections_connection_test_fail', exception);
      }
    }
  }

  private validate(
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

  private async prepareConfig(
    {
      state,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(connectionConfigContext);
    const driver = await this.dbDriverResource.load(state.config.driverId!, ['includeProviderProperties']);

    if (state.mode === 'edit') {
      config.connectionId = state.config.connectionId;
    }

    config.name = state.config.name?.trim();

    if (config.name && state.mode === 'create') {
      if (state.type === 'admin') {
        await this.connectionsResource.loadAll();
        const connectionNames = this.connectionsResource.values.map(connection => connection.name);
        config.name = getUniqueConnectionName(config.name, connectionNames);
      } else {
        const connectionNames = this.connectionInfoResource.values.map(connection => connection.name);
        config.name = getUniqueConnectionName(config.name, connectionNames);
      }
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
        config.credentials = state.config.credentials;
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

    if (
      config.name !== data.info.name
      || config.description !== data.info.description
      || config.template !== data.info.template
      || config.driverId !== data.info.driverId
      || (config.url !== undefined && config.url !== data.info.url)
      || (config.host !== undefined && config.host !== data.info.host)
      || (config.port !== undefined && config.port !== data.info.port)
      || (config.databaseName !== undefined && config.databaseName !== data.info.databaseName)
      || config.credentials !== undefined
      || (config.authModelId !== undefined && config.authModelId !== data.info.authModel)
      || (config.saveCredentials !== undefined && config.saveCredentials !== data.info.saveCredentials)
      || (
        config.providerProperties !== undefined
        && !isPropertiesEqual(config.providerProperties, data.info.providerProperties)
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

    let properties = authModel?.properties;

    if (connectionInfo && connectionInfo.authProperties.length > 0) {
      properties = connectionInfo.authProperties;
    }

    return properties;
  }
}
