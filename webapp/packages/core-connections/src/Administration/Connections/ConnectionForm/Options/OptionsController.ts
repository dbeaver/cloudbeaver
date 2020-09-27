/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed } from 'mobx';

import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { DatabaseAuthModelsResource } from '../../../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../../../DBDriverResource';
import { IConnectionFormModel } from '../IConnectionFormModel';

@injectable()
export class OptionsController
implements IInitializableController {

  @computed get drivers() {
    return Array.from(this.dbDriverResource.data.values())
      .filter(({ id }) => this.model.availableDrivers.includes(id));
  }

  @computed get driver() {
    return this.dbDriverResource.get(this.model.connection.driverId);
  }

  @computed get authModel() {
    if (!this.model.connection?.authModel && !this.driver) {
      return null;
    }
    return this.dbAuthModelsResource.get(this.model.connection?.authModel || this.driver!.defaultAuthModel) || null;
  }

  @computed get authModelLoading() {
    return this.dbAuthModelsResource.isLoading();
  }

  private model!: IConnectionFormModel;
  private nameTemplate = /^.*?\s(|\(.*?\)\s)connection$/

  constructor(
    private notificationService: NotificationService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private dbDriverResource: DBDriverResource,
  ) { }

  init(model: IConnectionFormModel) {
    this.model = model;
    this.loadDrivers();
  }

  onSelectDriver = (driverId: string | null, name: 'driverId', prevValue: string | null) => this.loadDriver(driverId, prevValue);
  onFormChange = () => {
    this.updateName();
    this.resetPassword();
  }

  @action
  private setDefaults(prevDriverId: string | null) {
    this.setDefaultParameters(prevDriverId);
    this.model.connection.properties = {};
    this.model.connection.authModel = this.driver?.defaultAuthModel;
    this.cleanCredentials();
  }

  private resetPassword() {
    if (this.isCredentialsChanged()) {
      for (const property of this.model.connection.authProperties) {
        if (property.features.includes('password') && this.model.credentials[property.id!] === property.value) {
          this.model.credentials[property.id!] = '';
          return;
        }
      }
    }
  }

  private isCredentialsChanged() {
    if (!this.model.connection.authProperties.length) {
      return true;
    }
    for (const property of this.model.connection.authProperties) {
      if (this.model.credentials[property.id!] !== property.value) {
        return true;
      }
    }
    return false;
  }

  private cleanCredentials() {
    for (const property of Object.keys(this.model.credentials)) {
      delete this.model.credentials[property];
    }
  }

  private setDefaultParameters(prevDriverId?: string | null) {
    const prevDriver = this.dbDriverResource.get(prevDriverId || '');

    if (this.model.connection.host === prevDriver?.defaultServer) {
      this.model.connection.host = this.driver?.defaultServer || 'localhost';
    }

    if (this.model.connection.port === prevDriver?.defaultPort) {
      this.model.connection.port = this.driver?.defaultPort;
    }

    if (this.model.connection.databaseName === prevDriver?.defaultDatabase) {
      this.model.connection.databaseName = this.driver?.defaultDatabase;
    }

    if (this.model.connection.url === prevDriver?.sampleURL) {
      this.model.connection.url = this.driver?.sampleURL;
    }

    this.updateName();
  }

  private updateName() {
    const databaseNames = ['New', ...this.drivers.map(driver => driver.name!)]
      .filter(Boolean);

    if (this.model.connection.name === undefined
        || (this.nameTemplate.test(this.model.connection.name)
            && databaseNames.some(driver => this.model.connection.name.startsWith(driver)))
    ) {
      this.model.connection.name = this.getNameTemplate();
    }
  }

  private getNameTemplate() {
    if (this.driver) {
      let address = [this.model.connection.host, this.model.connection.host && this.model.connection.port]
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
          this.model.connection?.authModel || this.driver.defaultAuthModel
        );

        if (this.authModel) {
          for (const property of this.model.connection.authProperties) {
            this.model.credentials[property.id!] = property.value;
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
      this.model.connection.authModel = undefined;
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
        this.model.connection?.authModel || this.driver.defaultAuthModel
      );

      if (this.authModel) {
        for (const property of this.model.connection.authProperties) {
          this.model.credentials[property.id!] = property.value;
        }
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver auth model');
    }
  }
}
