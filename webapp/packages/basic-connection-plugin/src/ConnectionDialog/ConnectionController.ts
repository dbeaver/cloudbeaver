/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action } from 'mobx';

import {
  ConnectionsManagerService, DBSource, ErrorDetailsDialog,
} from '@dbeaver/core/app';
import { injectable, IInitializableController, IDestructibleController } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { ConnectionConfig, GQLError } from '@dbeaver/core/sdk';

import { BasicConnectionService } from '../BasicConnectionService';

export enum ConnectionStep {
  DBSource,
  Connection
}

export interface IConnectionController {
  dbSource: DBSource | null;
  config: ConnectionConfig;
  isConnecting: boolean;
  onChange<T extends keyof ConnectionConfig>(property: T, value: ConnectionConfig[T]): void;
  onConnect(): void;
}

@injectable()
export class ConnectionController
implements IInitializableController, IDestructibleController, IConnectionController {
  @observable step = ConnectionStep.DBSource
  @observable isLoading = true;
  @observable isConnecting = false;
  @observable dbSource: DBSource | null = null
  @observable config: ConnectionConfig = {
    userName: '',
    userPassword: '',
  }
  @observable hasDetails = false
  @observable responseMessage: string | null = null

  private exception: GQLError | null = null;
  private onClose!: () => void
  private isDistructed = false;

  get dbSources() {
    return this.basicConnectionService.getDBSources();
  }

  get dbDrivers() {
    return this.connectionsManagerService.getDBDrivers();
  }

  get dbDriver() {
    if (!this.dbSource) {
      return undefined;
    }
    return this.dbDrivers.get(this.dbSource.driverId);
  }

  constructor(private connectionsManagerService: ConnectionsManagerService,
    private basicConnectionService: BasicConnectionService,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService) { }

  init(onClose: () => void) {
    this.onClose = onClose;
    this.loadDBSources();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onStep = (step: ConnectionStep) => {
    this.step = step;
    this.clearError();
  }

  onChange = (property: keyof ConnectionConfig, value: any) => {
    this.config[property] = value;
  }

  onConnect = async () => {
    this.isConnecting = true;
    this.clearError();
    try {
      const connection = await this.basicConnectionService.openConnectionAsync(this.getConnectionConfig());

      this.notificationService.logInfo({ title: `Connection ${connection.name} established` });
      this.onClose();
    } catch (exception) {
      this.showError(exception, 'Failed to establish connection');
    } finally {
      this.isConnecting = false;
    }
  }

  onDBSourceSelect = (sourceId: string) => {
    this.dbSource = this.dbSources.find(dbSource => dbSource.id === sourceId)!;
    this.clearError();
    this.setDBSourceDefaults();

    this.step = ConnectionStep.Connection;
    if (this.dbDriver && this.dbDriver.anonymousAccess) {
      this.onConnect();
    }
  }

  onShowDetails = () => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
  }

  private getConnectionConfig(): ConnectionConfig {
    const config: ConnectionConfig = {};
    config.dataSourceId = this.config.dataSourceId;
    config.userName = this.config.userName;
    config.userPassword = this.config.userPassword;

    return config;
  }

  @action
  private setDBSourceDefaults() {
    this.config.dataSourceId = this.dbSource?.id;
    this.config.userName = '';
    this.config.userPassword = '';
  }

  private clearError() {
    this.responseMessage = null;
    this.hasDetails = false;
    this.exception = null;
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

  private async loadDBSources() {
    try {
      await this.basicConnectionService.dbSources.load();
      await this.connectionsManagerService.loadDriversAsync();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load database sources');
    } finally {
      this.isLoading = false;
    }
  }
}
