/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action } from 'mobx';

import { DBDriver, ErrorDetailsDialog } from '@dbeaver/core/app';
import { injectable, IInitializableController, IDestructibleController } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { ConnectionConfig, GQLError } from '@dbeaver/core/sdk';

import { CustomConnectionService } from '../../CustomConnectionService';

export enum ConnectionType {
  Attributes,
  URL
}

@injectable()
export class ConnectionFormDialogController
implements IInitializableController, IDestructibleController {
  @observable connectionType = ConnectionType.Attributes
  @observable isLoading = true;
  @observable isConnecting = false;
  @observable driver!: DBDriver
  @observable config: ConnectionConfig = {
    name: '',
    driverId: '',
    host: '',
    port: '',
    databaseName: '',
    userName: '',
    userPassword: '',
    url: '',
    properties: {},
  }
  @observable hasDetails = false
  @observable responseMessage: string | null = null

  private exception: GQLError | null = null;
  private onClose!: () => void
  private isDistructed = false;

  constructor(private customConnectionService: CustomConnectionService,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService) { }

  init(driver: DBDriver, onClose: () => void) {
    this.driver = driver;
    this.onClose = onClose;
    this.setDriverDefaults();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onChangeType = (type: ConnectionType) => {
    this.connectionType = type;
  }

  onChange = (property: keyof ConnectionConfig, value: any) => {
    this.config[property] = value;
  }

  onTestConnection = async () => {
    this.isConnecting = true;
    this.clearError();
    try {
      await this.customConnectionService.testConnectionAsync(this.getConnectionConfig());

      this.notificationService.logInfo({ title: 'Connection is established' });
    } catch (exception) {
      this.showError(exception, 'Connection test failed');
    } finally {
      this.isConnecting = false;
    }
  }

  onCreateConnection = async () => {
    this.isConnecting = true;
    this.clearError();
    try {
      const connection = await this.customConnectionService.createConnectionAsync(this.getConnectionConfig());

      this.notificationService.logInfo({ title: `Connection ${connection.name} created` });
      this.onClose();
    } catch (exception) {
      this.showError(exception, 'Failed to create connection');
    } finally {
      this.isConnecting = false;
    }
  }

  onShowDetails = () => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
  }

  private getConnectionConfig(): ConnectionConfig {
    const config: ConnectionConfig = {};
    config.name = this.config.name;
    config.driverId = this.config.driverId;

    if (this.connectionType === ConnectionType.Attributes) {
      config.name = this.config.databaseName;
      if (!this.driver?.embedded) {
        config.host = this.config.host;
        config.port = this.config.port;
        config.name += `@${this.config.host}`;
      }
      config.databaseName = this.config.databaseName;
    } else {
      config.name = this.urlToConnectionName(this.config.name, this.config.url);
      config.url = this.config.url;
    }
    if (!this.driver?.anonymousAccess) {
      config.userName = this.config.userName;
      config.userPassword = this.config.userPassword;
    }
    if (Object.keys(this.config.properties).length > 0) {
      config.properties = this.config.properties;
    }

    return config;
  }

  @action
  private setDriverDefaults() {
    this.config.name = `${this.driver?.name} (custom)`;
    this.config.driverId = this.driver?.id;
    this.config.host = '';
    this.config.port = this.driver?.defaultPort || '';
    this.config.databaseName = '';
    this.config.url = this.driver?.sampleURL || '';
    this.config.userName = '';
    this.config.userPassword = '';
    this.config.properties = {};
  }

  private clearError() {
    this.responseMessage = null;
    this.hasDetails = false;
    this.exception = null;
  }

  /**
   * Creates connection name based on connection url
   * @param defaultName default connection name if url parsing failed
   * @param url connection url
   */
  private urlToConnectionName(defaultName?: string, url?: string) {
    let name = defaultName;
    if (!url) {
      return name;
    }

    const matches = /^.*:\/\/(.*?)(:.*?|)(\/(.*)?|)$/.exec(url);
    if (!matches) {
      return name;
    }

    name = matches[1];
    if (matches[4]) {
      name += `@${matches[4]}`;
    }

    return name;
  }

  private showError(exception: Error, message: string) {
    if (exception instanceof GQLError && !this.isDistructed) {
      this.responseMessage = exception.errorText;
      this.hasDetails = exception.hasDetails();
      this.exception = exception;
    } else {
      this.notificationService.logException(exception, message);
    }
  }
}
