/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from '../../../ConnectionsResource';
import { CreateConnectionService } from '../../CreateConnectionService';

@injectable()
export class ConnectionSearchService {
  hosts = 'localhost';
  databases: AdminConnectionSearchInfo[];

  get disabled(): boolean {
    return this.createConnectionService.disabled;
  }

  set disabled(value: boolean) {
    this.createConnectionService.disabled = value;
  }

  constructor(
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private createConnectionService: CreateConnectionService,
    private administrationScreenService: AdministrationScreenService
  ) {
    makeObservable(this, {
      hosts: observable,
      databases: observable,
    });

    this.databases = [];
    this.search = this.search.bind(this);
    this.change = this.change.bind(this);
    this.select = this.select.bind(this);
  }

  close(): void {
    this.hosts = 'localhost';
    this.databases = [];
  }

  async load(): Promise<void> {
    if (this.administrationScreenService.isConfigurationMode && this.databases.length === 0) {
      await this.search();
    }
  }

  async search(): Promise<void> {
    if (this.disabled || !this.hosts || !this.hosts.trim()) {
      return;
    }

    this.disabled = true;

    try {
      const hosts = this.hosts
        .trim()
        .replace(/[\s,|+-]+/gm, ' ')
        .split(/[\s,|+-]/);

      this.databases = await this.connectionsResource.searchDatabases(hosts);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Databases search failed');
    } finally {
      this.disabled = false;
    }
  }

  change(hosts: string): void {
    this.hosts = hosts;
  }

  select(database: AdminConnectionSearchInfo): void {
    this.createConnectionService.setConnectionTemplate(
      {
        ...this.connectionsResource.getEmptyConfig(),
        driverId: database.defaultDriver,
        host: database.host,
        port: `${database.port}`,
      },
      database.possibleDrivers
    );
  }
}
