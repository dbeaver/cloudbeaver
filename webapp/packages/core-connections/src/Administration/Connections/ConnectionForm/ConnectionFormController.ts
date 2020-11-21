/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import {
  injectable, IInitializableController
} from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ConnectionConfig } from '@cloudbeaver/core-sdk';

import { DBDriver, DBDriverResource } from '../../../DBDriverResource';
import { ConnectionsResource, isLocalConnection } from '../../ConnectionsResource';
import { IConnectionFormModel } from './IConnectionFormModel';

@injectable()
export class ConnectionFormController
implements IInitializableController {
  @observable isSaving: boolean;

  readonly afterSave: IExecutor<string>;

  get isUrlConnection(): boolean {
    if (this.model.editing) {
      return this.model.connection.useUrl;
    }
    return !this.driver?.sampleURL;
  }

  get isDisabled(): boolean {
    return this.isSaving;
  }

  /** It will be loaded by options controller */
  @computed get driver(): DBDriver | null {
    return this.dbDriverResource.get(this.model.connection.driverId) || null;
  }

  private model!: IConnectionFormModel;
  private close!: () => void;

  constructor(
    private connectionsResource: ConnectionsResource,
    private notificationService: NotificationService,
    private dbDriverResource: DBDriverResource
  ) {
    this.isSaving = false;
    this.afterSave = new Executor();
  }

  get local(): boolean {
    return isLocalConnection(this.model.connection);
  }

  init(
    model: IConnectionFormModel,
    close: () => void
  ): void {
    this.model = model;
    this.close = close;
  }

  save = async (): Promise<void> => {
    this.isSaving = true;
    try {
      if (this.model.editing) {
        const connection = await this.connectionsResource.update(this.model.connection.id, this.getConnectionConfig());
        await this.afterSave.execute(connection.id);

        this.notificationService.logSuccess({ title: `Connection ${connection.name} updated` });
      } else {
        const connection = await this.connectionsResource.create(this.getConnectionConfig());
        await this.afterSave.execute(connection.id);
        this.close();
        this.notificationService.logSuccess({ title: `Connection ${connection.name} created` });
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'connections_connection_create_fail');
    } finally {
      this.isSaving = false;
    }
  };

  test = async (): Promise<void> => {
    this.isSaving = true;
    try {
      await this.connectionsResource.test(this.getConnectionConfig());
      this.notificationService.logSuccess({ title: 'Connection is established' });
    } catch (exception) {
      this.notificationService.logException(exception, 'connections_connection_test_fail');
    } finally {
      this.isSaving = false;
    }
  };

  private getConnectionConfig(): ConnectionConfig {
    const config: ConnectionConfig = {};

    if (this.model.editing) {
      config.connectionId = this.model.connection.id;
    }

    config.name = this.model.connection.name;
    config.description = this.model.connection.description;
    config.template = this.model.connection.template;
    config.driverId = this.model.connection.driverId;

    if (!this.isUrlConnection) {
      if (!this.driver?.embedded) {
        config.host = this.model.connection.host;
        config.port = this.model.connection.port;
      }
      config.databaseName = this.model.connection.databaseName;
    } else {
      config.url = this.model.connection.url;
    }
    if (this.model.connection.authModel || this.driver!.defaultAuthModel) {
      config.authModelId = this.model.connection.authModel || this.driver!.defaultAuthModel;
      config.saveCredentials = this.model.connection.saveCredentials;
      if (this.isCredentialsChanged()) {
        config.credentials = this.model.credentials;
      }
    }
    if (Object.keys(this.model.connection.properties).length > 0) {
      config.properties = this.model.connection.properties;
    }

    return config;
  }

  private isCredentialsChanged() {
    if (!this.model.connection.authProperties.length) {
      return true;
    }
    for (const property of this.model.connection.authProperties) {
      const value = this.model.credentials[property.id!];

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
