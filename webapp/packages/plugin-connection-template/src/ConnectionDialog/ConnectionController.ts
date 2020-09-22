/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import {
  DBDriverResource, Connection, DatabaseAuthModelsResource, ConnectionInfoResource
} from '@cloudbeaver/core-connections';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLError, DatabaseAuthModel } from '@cloudbeaver/core-sdk';

import { TemplateConnectionsResource } from '../TemplateConnectionsResource';

export enum ConnectionStep {
  ConnectionTemplateSelect,
  Connection
}

export interface IConnectionController {
  template: Connection | null;
  credentials: any;
  isConnecting: boolean;
  onConnect(): void;
}

@injectable()
export class ConnectionController
implements IInitializableController, IDestructibleController, IConnectionController {
  @observable step = ConnectionStep.ConnectionTemplateSelect
  @observable isLoading = true;
  @observable isConnecting = false;
  @observable template: Connection | null = null
  @observable authModel?: DatabaseAuthModel;
  @observable credentials: any = { }
  @observable hasDetails = false
  @observable responseMessage: string | null = null

  private exception: GQLError | null = null;
  private onClose!: () => void
  private isDistructed = false;

  get templateConnections() {
    return this.templateConnectionsResource.data;
  }

  get dbDrivers() {
    return this.dbDriverResource.data;
  }

  get dbDriver() {
    if (!this.template) {
      return undefined;
    }
    return this.dbDrivers.get(this.template.driverId);
  }

  constructor(
    private dbDriverResource: DBDriverResource,
    private connectionInfoResource: ConnectionInfoResource,
    private templateConnectionsResource: TemplateConnectionsResource,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private dbAuthModelsResource: DatabaseAuthModelsResource
  ) { }

  init(onClose: () => void) {
    this.onClose = onClose;
    this.loadTemplateConnections();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onStep = (step: ConnectionStep) => {
    this.step = step;
    this.clearError();

    if (step === ConnectionStep.ConnectionTemplateSelect) {
      this.template = null;
    }
  }

  onConnect = async () => {
    if (!this.template) {
      return;
    }

    this.isConnecting = true;
    this.clearError();
    try {
      const connection = await this.connectionInfoResource.createFromTemplate(this.template.id);

      try {
        await this.connectionInfoResource.init(connection.id, this.credentials);

        this.notificationService.logInfo({ title: `Connection ${connection.name} established` });
        this.onClose();
      } catch (exception) {
        this.showError(exception, 'Failed to establish connection');
        await this.connectionInfoResource.deleteConnection(connection.id);
      }
    } catch (exception) {
      this.showError(exception, 'Failed to establish connection');
    } finally {
      this.isConnecting = false;
    }
  }

  onTemplateSelect = async (templateId: string) => {
    this.template = this.templateConnections.find(template => template.id === templateId)!;

    await this.loadAuthModel();
    this.clearError();
    this.credentials = {};

    this.step = ConnectionStep.Connection;
    if (!this.authModel) {
      this.onConnect();
    }
  }

  onShowDetails = () => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
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

  private async loadTemplateConnections() {
    try {
      await this.templateConnectionsResource.loadAll();
      await this.dbDriverResource.loadAll();
    } catch (exception) {
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
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver auth model');
    } finally {
      this.isLoading = false;
    }
  }
}
