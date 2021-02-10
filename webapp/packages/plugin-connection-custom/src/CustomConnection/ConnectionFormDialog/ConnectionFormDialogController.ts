/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action, makeObservable } from 'mobx';

import { DBDriver, DatabaseAuthModelsResource, ConnectionInfoResource, getUniqueConnectionName } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { ConnectionConfig, GQLErrorCatcher, DatabaseAuthModel } from '@cloudbeaver/core-sdk';

import { CustomConnectionService } from '../../CustomConnectionService';

interface IValidationStatus {
  status: boolean;
  errorMessage: string;
}

@injectable()
export class ConnectionFormDialogController
implements IInitializableController, IDestructibleController {
  isLoading = true;
  isConnecting = false;
  driver!: DBDriver;
  authModel?: DatabaseAuthModel;
  config: ConnectionConfig = {
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
  /** we want to save prev generated config name to detect if user changed "name" field to turn off autofill */
  private prevGeneratedName: string | null = null;
  private maxHostLength = 20;

  constructor(
    private customConnectionService: CustomConnectionService,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private connectionInfoResource: ConnectionInfoResource,
  ) {
    makeObservable<ConnectionFormDialogController, 'setDriverDefaults'>(this, {
      isLoading: observable,
      isConnecting: observable,
      driver: observable,
      authModel: observable,
      config: observable,
      setDriverDefaults: action,
    });
  }

  init(driver: DBDriver, onClose: () => void) {
    this.driver = driver;
    this.onClose = onClose;
    this.loadDatabaseAuthModel();
    this.setDriverDefaults();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onChange = (value?: unknown, name?: string): void => {
    if (name !== 'name') {
      this.updateNameTemplate(this.config);
    }
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
    const connectionConfig = this.getConnectionConfig();
    const validation = this.validate(connectionConfig);
    if (!validation.status) {
      this.notificationService.logError({ title: 'customConnection_create_error', message: validation.errorMessage });
      return;
    }

    this.isConnecting = true;
    this.error.clear();
    try {
      const connectionNames = Array.from(this.connectionInfoResource.data.values()).map(connection => connection.name);
      connectionConfig.name = getUniqueConnectionName(connectionConfig.name || 'Connection', connectionNames);
      const connection = await this.customConnectionService.createConnectionAsync(connectionConfig);

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

  private updateNameTemplate(config: ConnectionConfig) {
    const isAutoFill = config.name === this.prevGeneratedName || this.prevGeneratedName === null;

    if (!isAutoFill) {
      return;
    }

    if (this.isUrlConnection) {
      this.prevGeneratedName = config.url || '';
      config.name = config.url || '';
      return;
    }

    if (!this.driver) {
      config.name = 'New connection';
      return;
    }

    let name = this.driver.name || '';
    if (config.host) {
      name += '@' + config.host.slice(0, this.maxHostLength);
      if (config.port && config.port !== this.driver.defaultPort) {
        name += ':' + config.port;
      }
    }
    this.prevGeneratedName = name;
    config.name = name;
  }

  private getConnectionConfig(): ConnectionConfig {
    const config: ConnectionConfig = {};
    config.name = this.config.name?.trim();
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

  private validate(config: ConnectionConfig) {
    const validationStatus: IValidationStatus = { status: true, errorMessage: '' };

    if (!config.name?.length) {
      validationStatus.errorMessage = "Field 'name' can't be empty";
    }

    validationStatus.status = !validationStatus.errorMessage;
    return validationStatus;
  }

  private setDriverDefaults() {
    this.config.host = this.driver.defaultServer || 'localhost';
    this.config.port = this.driver.defaultPort || '';
    this.config.url = this.driver.sampleURL || '';
    this.config.driverId = this.driver.id;
    this.config.databaseName = this.driver.defaultDatabase;
    this.config.properties = {};
    this.config.authModelId = this.driver.defaultAuthModel;
    this.config.credentials = {};

    this.updateNameTemplate(this.config);
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
