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
import { GQLErrorCatcher, AdminConnectionGrantInfo, ResourceKeyUtils, ResourceKey } from '@cloudbeaver/core-sdk';

import { DatabaseAuthModelsResource } from '../../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../../DBDriverResource';
import { AdminConnection, ConnectionsResource } from '../../ConnectionsResource';

@injectable()
export class ConnectionEditController
implements IInitializableController, IDestructibleController {
  @observable grantedSubjects: AdminConnectionGrantInfo[] | null = null;
  @observable isLoading = true;
  @observable credentials: Record<string, string> = {};
  @observable connection: AdminConnection | null = null;

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
    private dbAuthModelsResource: DatabaseAuthModelsResource
  ) {
    this.updateConnectionInfo = this.updateConnectionInfo.bind(this);
  }

  async init(id: string): Promise<void> {
    this.connectionId = id;
    await this.loadConnectionInfo();
    this.connectionsResource.onItemAdd.addHandler(this.updateConnectionInfo);
  }

  destruct(): void {
    this.connectionsResource.onItemAdd.removeHandler(this.updateConnectionInfo);
  }

  private async loadConnectionInfo() {
    this.isLoading = true;
    try {
      // we create a copy to protect the current value from mutation
      await this.connectionsResource.load(this.connectionId);
      await this.updateConnectionInfo(this.connectionId);
    } catch (exception) {
      this.notificationService.logException(exception, "Can't load ConnectionInfo", `Can't load ConnectionInfo ${this.connectionId}`);
    } finally {
      this.isLoading = false;
    }
  }

  private async updateConnectionInfo(key: ResourceKey<string>) {
    if (!ResourceKeyUtils.includes(key, this.connectionId)) {
      return;
    }
    this.connection = JSON.parse(JSON.stringify(await this.connectionsResource.load(this.connectionId)));
    await this.updateCredentials();
  }

  private cleanCredentials() {
    for (const property of Object.keys(this.credentials)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.credentials[property];
    }
  }

  private async updateCredentials() {
    this.cleanCredentials();
    if (!this.driver || this.driver.anonymousAccess || !this.connection) {
      return;
    }

    try {
      await this.dbAuthModelsResource.load(
        this.connection.authModel || this.driver.defaultAuthModel
      );

      for (const property of this.connection.authProperties) {
        if (!property.features.includes('password')) {
          this.credentials[property.id!] = property.value;
        }
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver auth model');
    }
  }
}
