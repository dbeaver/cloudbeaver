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
import { NotificationService } from '@cloudbeaver/core-events';
import { GQLErrorCatcher, AdminConnectionGrantInfo, ConnectionInfo } from '@cloudbeaver/core-sdk';

import { DBDriverResource } from '../../../DBDriverResource';
import { ConnectionsResource } from '../../ConnectionsResource';

@injectable()
export class ConnectionEditController
implements IInitializableController, IDestructibleController {
  @observable grantedSubjects: AdminConnectionGrantInfo[] | null = null;
  @observable isLoading = true;
  @observable credentials: Record<string, string> = {};
  @observable connection: ConnectionInfo | null = null;

  @computed get isDisabled() {
    return this.isLoading;
  }

  @computed get driver() {
    if (!this.connection?.driverId) {
      return null;
    }
    return this.dbDriverResource.get(this.connection.driverId) || null;
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

  constructor(
    private connectionsResource: ConnectionsResource,
    private notificationService: NotificationService,
    private dbDriverResource: DBDriverResource,
  ) { }

  init(id: string) {
    this.connectionId = id;
    this.loadConnectionInfo();
  }

  destruct(): void {
  }

  private async loadConnectionInfo() {
    this.isLoading = true;
    try {
      // we create a copy to protect the current value from mutation
      this.connection = JSON.parse(JSON.stringify(await this.connectionsResource.load(this.connectionId)));
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load ConnectionInfo ${this.connectionId}`);
    } finally {
      this.isLoading = false;
    }
  }
}
