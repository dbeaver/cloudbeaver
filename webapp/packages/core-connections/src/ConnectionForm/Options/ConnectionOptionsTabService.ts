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

import { ConnectionsResource } from '../../Administration/ConnectionsResource';
import { ConnectionInfoResource } from '../../ConnectionInfoResource';
import { DatabaseAuthModelsResource } from '../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../DBDriverResource';
import { getUniqueConnectionName } from '../../getUniqueConnectionName';
import { isJDBCConnection } from '../../isJDBCConnection';
import { IConnectionFormSubmitData, ConnectionFormService } from '../ConnectionFormService';
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
  }

  load(): void { }

  private async save(
    {
      form,
      data,
      options,
      submitType,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const status = contexts.getContext(this.connectionFormService.connectionStatusContext);
    const config = contexts.getContext(this.connectionFormService.connectionConfigContext);

    form.disabled = true;
    form.loading = true;

    try {
      if (options.type === 'admin') {
        if (submitType === 'submit') {
          if (options.mode === 'edit') {
            const connection = await this.connectionsResource.update(config.connectionId!, config);
            status.info(`Connection ${connection.name} updated`);
          } else {
            const connection = await this.connectionsResource.create(config);
            config.connectionId = connection.id;
            status.info(`Connection ${connection.name} created`);
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
          if (options.mode === 'edit') {
            const connection = await this.connectionInfoResource.update(config);
            status.info(`Connection ${connection.name} updated`);
          } else {
            const connection = await this.connectionInfoResource.createConnection(config);
            config.connectionId = connection.id;
            status.info(`Connection ${connection.name} created`);
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
    } finally {
      form.disabled = false;
      form.loading = false;
    }
  }

  private validate(
    {
      data,
      options,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const validation = contexts.getContext(this.connectionFormService.connectionValidationContext);

    if (!data.config.name?.length) {
      validation.error("Field 'name' can't be empty");
    }
  }

  private async prepareConfig(
    {
      data,
      options,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(this.connectionFormService.connectionConfigContext);
    const driver = await this.dbDriverResource.load(data.config.driverId!);

    if (options.mode === 'edit') {
      config.connectionId = data.config.connectionId;
    }

    config.name = data.config.name?.trim();

    if (config.name && options.mode === 'create') {
      if (options.type === 'admin') {
        await this.connectionsResource.loadAll();
        const connectionNames = this.connectionsResource.values.map(connection => connection.name);
        config.name = getUniqueConnectionName(config.name, connectionNames);
      } else {
        const connectionNames = this.connectionInfoResource.values.map(connection => connection.name);
        config.name = getUniqueConnectionName(config.name, connectionNames);
      }
    }

    config.description = data.config.description;
    config.template = data.config.template;
    config.driverId = data.config.driverId;

    if (isJDBCConnection(driver, data.info)) {
      config.url = data.config.url;
    } else {
      if (!driver.embedded) {
        config.host = data.config.host;
        config.port = data.config.port;
      }
      config.databaseName = data.config.databaseName;
    }

    if (data.config.authModelId || driver.defaultAuthModel) {
      config.authModelId = data.config.authModelId || driver.defaultAuthModel;
      config.saveCredentials = data.config.saveCredentials;

      const authModel = await this.databaseAuthModelsResource.load(config.authModelId);

      let properties = authModel?.properties;

      if (data.info && data.info.authProperties.length > 0) {
        properties = data.info.authProperties;
      }

      if (this.isCredentialsChanged(properties, data.config.credentials)) {
        config.credentials = data.config.credentials;
      }
    }

    if (driver.providerProperties.length > 0) {
      const providerProperties: Record<string, any> = { ...data.config.providerProperties };

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
}
