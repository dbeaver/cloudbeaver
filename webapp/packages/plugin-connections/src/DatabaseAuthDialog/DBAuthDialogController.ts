/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { ConnectionInfoResource, ConnectionInitConfig, DBDriverResource, USER_NAME_PROPERTY_ID } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';

import type { IConnectionAuthenticationConfig } from '../ConnectionAuthentication/IConnectionAuthenticationConfig';

@injectable()
export class DBAuthDialogController implements IInitializableController, IDestructibleController {
  isAuthenticating = false;
  configured = false;
  config: IConnectionAuthenticationConfig = {
    credentials: {},
    networkHandlersConfig: [],
    saveCredentials: false,
  };

  readonly error = new GQLErrorCatcher();

  private connectionId!: string;
  private isDistructed = false;
  private networkHandlers!: string[];
  private close!: () => void;

  constructor(
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
    private commonDialogService: CommonDialogService,
    private dbDriverResource: DBDriverResource
  ) {
    makeObservable(this, {
      isAuthenticating: observable.ref,
      configured: observable.ref,
      config: observable,
    });
  }

  async init(connectionId: string, networkHandlers: string[], onClose: () => void): Promise<void> {
    this.connectionId = connectionId;
    this.networkHandlers = networkHandlers;
    this.close = onClose;

    await this.loadAuthModel();
    this.loadDrivers();

    this.configured = true;
  }

  destruct(): void {
    this.isDistructed = true;
  }

  login = async (): Promise<void> => {
    if (this.isAuthenticating) {
      return;
    }

    this.isAuthenticating = true;
    try {
      await this.connectionInfoResource.init(this.getConfig());
      this.close();
    } catch (exception: any) {
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Authentication failed');
      }
    } finally {
      this.isAuthenticating = false;
    }
  };

  showDetails = (): void => {
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
    }

    config.saveCredentials = this.config.saveCredentials;

    if (this.config.networkHandlersConfig.length > 0) {
      config.networkCredentials = this.config.networkHandlersConfig;
    }

    return config;
  }

  private async loadAuthModel() {
    try {
      const connection = await this.connectionInfoResource.load(this.connectionId, ['includeAuthProperties', 'customIncludeNetworkHandlerCredentials']);

      if (connection.authNeeded) {
        const property = connection.authProperties?.find(property => property.id === USER_NAME_PROPERTY_ID);

        if (property?.value) {
          this.config.credentials[USER_NAME_PROPERTY_ID] = property.value;
        }
      }

      for (const id of this.networkHandlers) {
        const handler = connection.networkHandlersConfig.find(handler => handler.id === id);

        if (handler && (handler.userName || handler.authType !== NetworkHandlerAuthType.Password)) {
          this.config.networkHandlersConfig.push({
            id: handler.id,
            authType: handler.authType,
            userName: handler.userName,
            password: handler.password,
            savePassword: handler.savePassword,
          });
        }
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t load auth model');
    }
  }

  private async loadDrivers() {
    try {
      this.dbDriverResource.loadAll();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t load database drivers', '', true);
    }
  }
}
