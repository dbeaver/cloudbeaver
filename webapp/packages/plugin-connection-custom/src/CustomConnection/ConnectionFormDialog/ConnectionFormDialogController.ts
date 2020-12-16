/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action } from 'mobx';

import { DBDriver, DatabaseAuthModelsResource, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { ConnectionConfig, GQLErrorCatcher, DatabaseAuthModel } from '@cloudbeaver/core-sdk';

import { CustomConnectionService } from '../../CustomConnectionService';
@injectable()
export class ConnectionFormDialogController
implements IInitializableController, IDestructibleController {
  @observable isLoading = true;
  @observable isConnecting = false;
  @observable driver!: DBDriver;
  @observable authModel?: DatabaseAuthModel;
  @observable config: ConnectionConfig = {
    name: '',
    driverId: '',
    host: '',
    port: '',
    databaseName: '',
    url: '',
    properties: {},
    credentials: {},
    saveCredentials: false,
  };

  get isUrlConnection() {
    return !this.driver.sampleURL;
  }

  readonly error = new GQLErrorCatcher();
  private onClose!: () => void;
  private isDistructed = false;
  private nameTemplate = /(\w+)@([^\s]+[\d])$/;

  constructor(
    private customConnectionService: CustomConnectionService,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private connectionInfoResource: ConnectionInfoResource,
  ) { }

  init(driver: DBDriver, onClose: () => void) {
    this.driver = driver;
    this.onClose = onClose;
    this.loadDatabaseAuthModel();
    this.setDriverDefaults();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onChange = (property: keyof ConnectionConfig, value: any) => {
    this.config[property] = value;
    this.updateName(property);
  };

  onTestConnection = async () => {
    this.isConnecting = true;
    this.error.clear();
    try {
      await this.customConnectionService.testConnectionAsync(this.getConnectionConfig());

      this.notificationService.logSuccess({ title: 'Connection is established' });
    } catch (exception) {
      this.notificationService.logException(exception, 'connections_connection_test_fail');
    } finally {
      this.isConnecting = false;
    }
  };

  onCreateConnection = async () => {
    const validationStatus = this.validate();
    if (!validationStatus.passed) {
      this.showError(new Error(validationStatus.errorMsg), 'customConnection_create_error');
      return;
    }

    this.isConnecting = true;
    this.error.clear();
    try {
      const connection = await this.customConnectionService.createConnectionAsync(this.getConnectionConfig());

      this.notificationService.logSuccess({ title: `Connection ${connection.name} created` });
      this.onClose();
    } catch (exception) {
      this.notificationService.logException(exception, 'connections_connection_create_fail');
    } finally {
      this.isConnecting = false;
    }
  };

  onShowDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  };

  private updateName(name?: keyof ConnectionConfig) {
    if (name === 'name') {
      return;
    }

    const matches = this.nameTemplate.exec(this.config.name!);

    if (this.config.name === undefined || (matches?.length && this.driver.name === matches[1])) {
      this.config.name = this.getNameTemplate();
    }
  }

  private getNameTemplate() {
    if (this.driver) {
      const address = [this.config.host, this.config.host && this.config.port]
        .filter(Boolean)
        .join(':');

      return `${this.driver.name}@${address || ''}`;
    }

    return 'New connection';
  }

  private getNotDuplicatedConnectionName(name: string) {
    let index = 0;
    let nameToCheck = name.trim();

    const connectionsNames = new Set();
    for (const connection of this.connectionInfoResource.data.values()) {
      connectionsNames.add(connection.name);
    }

    while (true) {
      if (connectionsNames.has(nameToCheck)) {
        index += 1;
        nameToCheck = `${name} (${index})`;
        continue;
      }
      break;
    }

    return nameToCheck;
  }

  private getConnectionConfig(): ConnectionConfig {
    const config: ConnectionConfig = {};
    config.name = this.getNotDuplicatedConnectionName(this.config.name!);
    config.driverId = this.config.driverId;

    if (!this.isUrlConnection) {
      if (!this.driver?.embedded) {
        config.host = this.config.host;
        config.port = this.config.port;
      }
      config.databaseName = this.config.databaseName;
    } else {
      config.url = this.config.url;
    }
    if (this.authModel) {
      config.authModelId = this.config.authModelId;
      config.credentials = this.config.credentials;
      config.saveCredentials = this.config.saveCredentials;
    }
    if (Object.keys(this.config.properties).length > 0) {
      config.properties = this.config.properties;
    }

    return config;
  }

  private validate() {
    const status = { passed: true, errorMsg: '' };
    if (!this.config.name?.trim().length) {
      status.errorMsg = 'Field "Name" can"t be empty';
    }
    status.passed = !status.errorMsg;
    return status;
  }

  @action
  private setDriverDefaults() {
    this.config.name = `${this.driver.name}@${this.driver.defaultServer || 'localhost'}:${this.driver.defaultPort || ''}`;
    this.config.driverId = this.driver.id;
    this.config.host = this.driver.defaultServer || 'localhost';
    this.config.port = this.driver.defaultPort || '';
    this.config.databaseName = this.driver.defaultDatabase;
    this.config.url = this.driver.sampleURL || '';
    this.config.properties = {};
    this.config.authModelId = this.driver.defaultAuthModel;
    this.config.credentials = {};
  }

  private showError(exception: Error, title: string) {
    if (!this.error.catch(exception) || this.isDistructed) {
      this.notificationService.logException(exception, title);
    }
  }

  private async loadDatabaseAuthModel() {
    if (!this.driver || this.driver.anonymousAccess) {
      this.isLoading = false;
      return;
    }

    try {
      this.authModel = await this.dbAuthModelsResource.load(this.driver.defaultAuthModel);
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver auth model');
    } finally {
      this.isLoading = false;
    }
  }
}
