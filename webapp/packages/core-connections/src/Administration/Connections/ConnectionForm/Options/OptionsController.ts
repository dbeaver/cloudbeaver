/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action, computed } from 'mobx';

import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';

import { DatabaseAuthModelsResource } from '../../../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../../../DBDriverResource';

@injectable()
export class OptionsController
implements IInitializableController {
  @observable credentials!: Record<string, number | string>;
  @observable availableDrivers!: string[];

  @computed get drivers() {
    return Array.from(this.dbDriverResource.data.values())
      .filter(({ id }) => this.availableDrivers.includes(id));
  }

  @computed get driver() {
    return this.dbDriverResource.get(this.connectionInfo.driverId);
  }

  @computed get authModel() {
    if (!this.connectionInfo?.authModel && !this.driver) {
      return null;
    }
    return this.dbAuthModelsResource.get(this.connectionInfo?.authModel || this.driver!.defaultAuthModel) || null;
  }

  @computed get authModelLoading() {
    return this.dbAuthModelsResource.isLoading();
  }

  private connectionInfo!: ConnectionInfo;
  private nameTemplate = /^.*?\s(|\(.*?\)\s)connection$/

  constructor(
    private notificationService: NotificationService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private dbDriverResource: DBDriverResource,
  ) { }

  init(connection: ConnectionInfo, credentials: Record<string, number | string>, availableDrivers: string[]) {
    this.connectionInfo = connection;
    this.credentials = credentials;
    this.availableDrivers = availableDrivers;
    this.loadDrivers();
  }

  onSelectDriver = (driverId: string | null, name: 'driverId', prevValue: string | null) => this.loadDriver(driverId, prevValue);
  onFormChange = () => this.updateName();

  @action
  private setDefaults(prevDriverId: string | null) {
    this.setDefaultParameters(prevDriverId);
    this.connectionInfo.properties = {};
    this.connectionInfo.authModel = this.driver?.defaultAuthModel;
    this.cleanCredentials();
  }

  private cleanCredentials() {
    for (const property of Object.keys(this.credentials)) {
      delete this.credentials[property];
    }
  }

  private setDefaultParameters(prevDriverId?: string | null) {
    const prevDriver = this.dbDriverResource.get(prevDriverId || '');

    if (this.connectionInfo.host === prevDriver?.defaultServer) {
      this.connectionInfo.host = this.driver?.defaultServer;
    }

    if (this.connectionInfo.port === prevDriver?.defaultPort) {
      this.connectionInfo.port = this.driver?.defaultPort;
    }

    if (this.connectionInfo.databaseName === prevDriver?.defaultDatabase) {
      this.connectionInfo.databaseName = this.driver?.defaultDatabase;
    }

    if (this.connectionInfo.url === prevDriver?.sampleURL) {
      this.connectionInfo.url = this.driver?.sampleURL;
    }

    this.updateName();
  }

  private updateName() {
    const databaseNames = ['New', ...this.drivers.map(driver => driver.name!)]
      .filter(Boolean);

    if (!this.connectionInfo.name
        || (this.nameTemplate.test(this.connectionInfo.name)
            && databaseNames.some(driver => this.connectionInfo.name.startsWith(driver)))
    ) {
      this.connectionInfo.name = this.getNameTemplate();
    }
  }

  private getNameTemplate() {
    if (this.driver) {
      let address = [this.connectionInfo.host, this.connectionInfo.host && this.connectionInfo.port]
        .filter(Boolean)
        .join(':');

      if (address) {
        address = ` (${address})`;
      }

      return `${this.driver.name}${address} connection`;
    }

    return 'New connection';
  }

  private async loadDrivers() {
    try {
      await this.dbDriverResource.loadAll();
      this.setDefaultParameters();

      if (!this.driver || this.driver.anonymousAccess) {
        return;
      }

      try {
        await this.dbAuthModelsResource.load(
          this.connectionInfo?.authModel || this.driver.defaultAuthModel
        );

        if (this.authModel) {
          for (const property of this.connectionInfo.authProperties) {
            this.credentials[property.id!] = property.value;
          }
        }
      } catch (exception) {
        this.notificationService.logException(exception, 'Can\'t load driver auth model');
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load drivers');
    }
  }

  private async loadDriver(driverId: string | null, prev: string | null) {
    if (!driverId) {
      this.connectionInfo.authModel = undefined;
      this.cleanCredentials();
      return;
    }

    try {
      await this.dbDriverResource.load(driverId);
      this.setDefaults(prev);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load driver ${driverId}`);
    }

    if (!this.driver || this.driver.anonymousAccess) {
      return;
    }

    try {
      await this.dbAuthModelsResource.load(
        this.connectionInfo?.authModel || this.driver.defaultAuthModel
      );

      if (this.authModel) {
        for (const property of this.connectionInfo.authProperties) {
          this.credentials[property.id!] = property.value;
        }
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver auth model');
    }
  }
}
