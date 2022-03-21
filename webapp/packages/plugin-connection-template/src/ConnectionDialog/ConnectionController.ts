/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable, computed } from 'mobx';

import { DBDriverResource, Connection, DatabaseAuthModelsResource, ConnectionInfoResource, DBDriver, ConnectionInitConfig, USER_NAME_PROPERTY_ID } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { DatabaseAuthModel, DetailsError, NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import { getUniqueName } from '@cloudbeaver/core-utils';
import type { IConnectionAuthenticationConfig } from '@cloudbeaver/plugin-connections';

import { TemplateConnectionsResource } from '../TemplateConnectionsResource';

export enum ConnectionStep {
  ConnectionTemplateSelect,
  Connection
}

export interface IConnectionController {
  template: Connection | null;
  config: IConnectionAuthenticationConfig;
  isConnecting: boolean;
  onConnect: () => void;
}

@injectable()
export class ConnectionController
  implements IInitializableController, IDestructibleController, IConnectionController {
  step = ConnectionStep.ConnectionTemplateSelect;
  isLoading = true;
  isConnecting = false;
  template: Connection | null = null;
  authModel?: DatabaseAuthModel;
  config: IConnectionAuthenticationConfig = {
    credentials: {},
    networkHandlersConfig: [],
    saveCredentials: false,
  };

  hasDetails = false;
  responseMessage: string | null = null;

  private exception: DetailsError | null = null;
  private onClose!: () => void;
  private isDistructed = false;

  get templateConnections(): Connection[] {
    return this.templateConnectionsResource.data;
  }

  get dbDrivers(): Map<string, DBDriver> {
    return this.dbDriverResource.data;
  }

  get dbDriver(): DBDriver | undefined {
    if (!this.template) {
      return undefined;
    }
    return this.dbDrivers.get(this.template.driverId);
  }

  get networkHandlers(): string[] {
    if (!this.template) {
      return [];
    }

    return this.template.networkHandlersConfig
      .filter(handler => handler.enabled && !handler.savePassword)
      .map(handler => handler.id)
  }

  constructor(
    private dbDriverResource: DBDriverResource,
    private connectionInfoResource: ConnectionInfoResource,
    private templateConnectionsResource: TemplateConnectionsResource,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private dbAuthModelsResource: DatabaseAuthModelsResource
  ) {
    makeObservable(this, {
      step: observable,
      isLoading: observable,
      isConnecting: observable,
      template: observable,
      authModel: observable,
      config: observable,
      hasDetails: observable,
      responseMessage: observable,
      networkHandlers: computed
    });
  }

  init(onClose: () => void): void {
    this.onClose = onClose;
    this.loadTemplateConnections();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onStep = (step: ConnectionStep): void => {
    this.step = step;
    this.clearError();

    if (step === ConnectionStep.ConnectionTemplateSelect) {
      this.template = null;
    }
  };

  onConnect = async (): Promise<void> => {
    if (!this.template) {
      return;
    }

    this.isConnecting = true;
    this.clearError();
    try {
      const connectionNames = this.connectionInfoResource.values.map(connection => connection.name);
      const uniqueConnectionName = getUniqueName(this.template.name || 'Template connection', connectionNames);
      const connection = await this.connectionInfoResource.createFromTemplate(this.template.id, uniqueConnectionName);

      try {
        await this.connectionInfoResource.init(this.getConfig(connection.id));

        this.notificationService.logSuccess({ title: 'Connection is established', message: connection.name });
        this.onClose();
      } catch (exception: any) {
        this.showError(exception, 'Failed to establish connection');
        await this.connectionInfoResource.deleteConnection(connection.id);
      }
    } catch (exception: any) {
      this.showError(exception, 'Failed to establish connection');
    } finally {
      this.isConnecting = false;
    }
  };

  onTemplateSelect = async (templateId: string): Promise<void> => {
    this.template = this.templateConnections.find(template => template.id === templateId)!;

    await this.loadAuthModel();
    this.clearError();
    this.config = {
      credentials: {},
      networkHandlersConfig: [],
      saveCredentials: false,
    };

    if (this.template.authNeeded) {
      const property = this.template.authProperties?.find(property => property.id === USER_NAME_PROPERTY_ID);

      if (property?.value) {
        this.config.credentials[USER_NAME_PROPERTY_ID] = property.value;
      }
    }

    for (const id of this.networkHandlers) {
      const handler = this.template.networkHandlersConfig.find(handler => handler.id === id);

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

    this.step = ConnectionStep.Connection;
    if (!this.authModel) {
      this.onConnect();
    }
  };

  onShowDetails = (): void => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
  };

  private getConfig(connectionId: string) {
    const config: ConnectionInitConfig = {
      id: connectionId,
    };

    if (Object.keys(this.config.credentials).length > 0) {
      config.credentials = this.config.credentials;
      config.saveCredentials = this.config.saveCredentials;
    }

    if (this.config.networkHandlersConfig.length > 0) {
      config.networkCredentials = this.config.networkHandlersConfig;
    }

    return config;
  }

  private clearError() {
    this.responseMessage = null;
    this.hasDetails = false;
    this.exception = null;
  }

  private showError(exception: Error, message: string) {
    if (exception instanceof DetailsError && !this.isDistructed) {
      this.responseMessage = exception.errorMessage;
      this.hasDetails = exception.hasDetails();
      this.exception = exception;
    } else {
      this.notificationService.logException(exception, message);
    }
  }

  private async loadTemplateConnections() {
    try {
      await this.templateConnectionsResource.load();
      await this.dbDriverResource.loadAll();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t load database sources');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAuthModel() {
    if (!this.dbDriver || this.dbDriver.anonymousAccess) {
      return;
    }

    try {
      this.isLoading = true;
      this.authModel = await this.dbAuthModelsResource.load(this.dbDriver.defaultAuthModel);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t load driver auth model');
    } finally {
      this.isLoading = false;
    }
  }
}
