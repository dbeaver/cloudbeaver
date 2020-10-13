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
import { DatabaseAuthModel } from '@cloudbeaver/core-sdk';

import { DatabaseAuthModelsResource } from '../../../../DatabaseAuthModelsResource';
import { DBDriver, DBDriverResource } from '../../../../DBDriverResource';
import { IConnectionFormModel } from '../IConnectionFormModel';

@injectable()
export class OptionsController
implements IInitializableController {
  @computed get drivers(): DBDriver[] {
    return Array.from(this.dbDriverResource.data.values())
      .filter(({ id }) => this.model.availableDrivers.includes(id));
  }

  @computed get driver(): DBDriver | undefined {
    return this.dbDriverResource.get(this.model.connection.driverId);
  }

  @computed get authModel(): DatabaseAuthModel | null {
    if (!this.model.connection?.authModel && !this.driver) {
      return null;
    }
    return this.dbAuthModelsResource.get(this.model.connection?.authModel || this.driver!.defaultAuthModel) || null;
  }

  @computed get authModelLoading(): boolean {
    return this.dbAuthModelsResource.isLoading();
  }

  private model!: IConnectionFormModel;
  private nameTemplate = /^.*?\s(|\(.*?\)\s)connection$/;

  constructor(
    private notificationService: NotificationService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private dbDriverResource: DBDriverResource
  ) { }

  init(model: IConnectionFormModel): void {
    this.model = model;
    this.loadDrivers();
  }

  onSelectDriver = (
    driverId: string | null,
    name: string | undefined,
    prevValue: string | null
  ): Promise<void> => this.loadDriver(driverId, prevValue);

  onFormChange = (value?: unknown, name?: string): void => {
    this.updateName();
    this.resetPassword(name || '');
  };

  @action
  private setDefaults(prevDriverId: string | null) {
    this.setDefaultParameters(prevDriverId);
    this.model.connection.properties = {};
    this.model.connection.authModel = this.driver?.defaultAuthModel;
    this.cleanCredentials();
  }

  resetPassword = (name: string): void => {
    const passwordProperty = this.model.connection.authProperties.find(property => property.features.includes('password'));

    if (passwordProperty && (this.isCredentialsChanged() || passwordProperty.id === name)) {
      if (this.model.credentials[passwordProperty.id!] === passwordProperty.value) {
        this.model.credentials[passwordProperty.id!] = '';
        this.model.connection.saveCredentials = false;
      }
    }
  };

  private isCredentialsChanged() {
    if (!Object.keys(this.model.credentials).length) {
      return false;
    }
    for (const property of this.model.connection.authProperties) {
      if (property.value !== null && this.model.credentials[property.id!] !== property.value) {
        return true;
      }
    }
    return false;
  }

  private cleanCredentials() {
    for (const property of Object.keys(this.model.credentials)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
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
