/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';

import { ConnectionInfoResource, ConnectionInitConfig } from '../ConnectionInfoResource';
import { DBDriverResource } from '../DBDriverResource';
import type { IFormInitConfig } from './IFormInitConfig';

@injectable()
export class DBAuthDialogController implements IInitializableController, IDestructibleController {
  isAuthenticating = false;
  config: IFormInitConfig = {
    credentials: {},
    networkCredentials: [],
    saveCredentials: false,
  };

  readonly error = new GQLErrorCatcher();

  private connectionId!: string;
  private isDistructed = false;
  private close!: () => void;

  constructor(
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
    private commonDialogService: CommonDialogService,
    private dbDriverResource: DBDriverResource
  ) {
    makeObservable(this, {
      isAuthenticating: observable,
      config: observable,
    });
  }

  init(connectionId: string, onClose: () => void) {
    this.connectionId = connectionId;
    this.close = onClose;
    this.loadAuthModel();
    this.loadDrivers();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  login = async () => {
    if (this.isAuthenticating) {
      return;
    }

    this.isAuthenticating = true;
    try {
      await this.connectionInfoResource.init(this.getConfig());
      this.close();
    } catch (exception) {
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Authentication failed');
      }
    } finally {
      this.isAuthenticating = false;
    }
  };

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  };

  private getConfig() {
    const config: ConnectionInitConfig = {
      id: this.connectionId,
    };

    if (Object.keys(this.config.credentials).length > 0) {
      config.credentials = this.config.credentials;
      config.saveCredentials = this.config.saveCredentials;
    }

    if (this.config.networkCredentials.length > 0) {
      config.networkCredentials = this.config.networkCredentials;
    }

    return config;
  }

  private async loadAuthModel() {
    try {
      await this.connectionInfoResource.load(this.connectionId, ['includeAuthProperties']);
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load auth model');
    }
  }

  private async loadDrivers() {
    try {
      this.dbDriverResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load database drivers', '', true);
    }
  }
}
