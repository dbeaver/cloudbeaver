/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import {
  injectable, IInitializableController, IDestructibleController
} from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, AdminConnectionGrantInfo } from '@cloudbeaver/core-sdk';

import { DBDriverResource } from '../../../DBDriverResource';
import { ConnectionsResource } from '../../ConnectionsResource';

@injectable()
export class ConnectionEditController
implements IInitializableController, IDestructibleController {
  @observable grantedSubjects: AdminConnectionGrantInfo[] | null = null;
  @observable isLoading = true;
  @observable credentials: Record<string, string> = {};

  @computed get isDisabled() {
    return this.isLoading;
  }

  @computed get driver() {
    if (!this.connection?.driverId) {
      return null;
    }
    return this.dbDriverResource.get(this.connection.driverId) || null;
  }

  @computed get connection() {
    return this.connectionsResource.get(this.connectionId);
  }

  @computed get availableDrivers() {
    if (!this.connection) {
      return [];
    }
    return [this.connection.driverId];
  }

  connectionId!: string;

  readonly editing = true; // used as model IConnectionFormModel
  readonly error = new GQLErrorCatcher();
  private isDistructed = false;

  constructor(
    private connectionsResource: ConnectionsResource,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private dbDriverResource: DBDriverResource,
  ) { }

  init(id: string) {
    this.connectionId = id;
    this.loadConnectionInfo();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onShowDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }

  private showError(exception: Error, message: string) {
    if (!this.error.catch(exception) || this.isDistructed) {
      this.notificationService.logException(exception, message);
    }
  }

  private async loadConnectionInfo() {
    this.isLoading = true;
    try {
      await this.connectionsResource.load(this.connectionId);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load ConnectionInfo ${this.connectionId}`);
    } finally {
      this.isLoading = false;
    }
  }
}
