/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AdminConnectionSearchInfo, ConnectionInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { DBDriverResource } from '../../../DBDriverResource';
import { ConnectionsResource } from '../../ConnectionsResource';

@injectable()
export class CreateConnectionController {
  @observable hosts = 'localhost';
  @observable isProcessing = false;
  @observable databases: AdminConnectionSearchInfo[];
  @observable connection: ConnectionInfo | null;
  @observable availableDrivers: string[];
  @observable credentials: Record<string, string | number>;
  @observable grantedSubjects = [];

  @computed get driver() {
    if (!this.connection?.driverId) {
      return;
    }

    return this.dbDriverResource.get(this.connection.driverId);
  }

  constructor(
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private dbDriverResource: DBDriverResource,
  ) {
    this.credentials = {};
    this.databases = [];
    this.availableDrivers = [];
    this.connection = null;
  }

  search = async () => {
    if (this.isProcessing || !this.hosts || !this.hosts.trim()) {
      return;
    }

    this.isProcessing = true;

    try {
      const hosts = this.hosts
        .trim()
        .replace(/[\s,|+-]+/gm, ' ')
        .split(/[\s,|+-]/);

      this.databases = await this.connectionsResource.searchDatabases(hosts);
    } catch (exception) {
      this.notificationService.logException(exception, 'Databases search failed');
    } finally {
      this.isProcessing = false;
    }
  }

  onSearchChange = (hosts: string) => {
    this.hosts = hosts;
  }

  onDriverSelect = (driverId: string) => {
    this.connection = {
      id: uuid(),
      driverId,
      template: false,
      authProperties: [],
      properties: {},
    } as Partial<ConnectionInfo> as any;
    this.availableDrivers = [driverId];
  }

  onDatabaseSelect = (database: AdminConnectionSearchInfo) => {
    this.connection = {
      id: uuid(),
      driverId: database.defaultDriver,
      template: false,
      host: database.host,
      port: `${database.port}`,
      authProperties: [],
      properties: {},
    } as Partial<ConnectionInfo> as any;
    this.availableDrivers = database.possibleDrivers;
  }

  back = () => {
    this.connection = null;
    this.availableDrivers = [];
  }
}
