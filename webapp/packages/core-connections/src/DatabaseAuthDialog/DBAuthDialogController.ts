/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';

import { ConnectionInfoResource } from '../ConnectionInfoResource';
import { DBDriverResource } from '../DBDriverResource';

@injectable()
export class DBAuthDialogController implements IInitializableController, IDestructibleController {
  @observable isAuthenticating = false;
  @observable credentials = {};

  readonly error = new GQLErrorCatcher();

  private connectionId!: string;
  private isDistructed = false;
  private close!: () => void;

  constructor(
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
    private commonDialogService: CommonDialogService,
    private dbDriverResource: DBDriverResource,
  ) { }

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
      await this.connectionInfoResource.init(this.connectionId, this.credentials);
      this.close();
    } catch (exception) {
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Authentication failed');
      }
    } finally {
      this.isAuthenticating = false;
    }
  }

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }

  private async loadAuthModel() {
    try {
      await this.connectionInfoResource.loadAuthModel(this.connectionId);
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load auth model');
    }
  }

  private async loadDrivers() {
    try {
      this.dbDriverResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load database drivers', true);
    }
  }
}
