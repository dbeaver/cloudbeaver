/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable } from 'mobx';

import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AdminConnectionFragment, DatabaseAuthModel, ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { DatabaseAuthModelsResource } from '../../../../DatabaseAuthModelsResource';
import { DBDriver, DBDriverResource } from '../../../../DBDriverResource';
import type { IConnectionFormModel } from '../IConnectionFormModel';

@injectable()
export class OptionsController
implements IInitializableController {
  get drivers(): DBDriver[] {
    return Array.from(this.dbDriverResource.data.values())
      .filter(({ id }) => this.model.availableDrivers.includes(id));
  }

  get driver(): DBDriver | undefined {
    return this.dbDriverResource.get(this.model.connection.driverId);
  }

  get authModel(): DatabaseAuthModel | null {
    if (!this.model.connection?.authModel && !this.driver) {
      return null;
    }
    return this.dbAuthModelsResource.get(this.model.connection?.authModel || this.driver!.defaultAuthModel) || null;
  }

  get authModelLoading(): boolean {
    return this.dbAuthModelsResource.isLoading();
  }

  get properties(): ObjectPropertyInfo[] | undefined {
    if (this.model.connection.authProperties.length) {
      return this.model.connection.authProperties;
    }
    return this.authModel?.properties;
  }

  get providerProperties(): ObjectPropertyInfo[] | undefined {
    return this.dbDriverResource.get(this.model.connection.driverId)?.providerProperties;
  }

  private model!: IConnectionFormModel;
  /** we want to save prev generated connection name to detect if user changed "name" field to turn off autofill */
  private prevGeneratedName: string | null = null;
  private maxHostLength = 20;

  constructor(
    private notificationService: NotificationService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private dbDriverResource: DBDriverResource,
  ) {
    makeObservable<OptionsController, 'setDefaults'>(this, {
      drivers: computed,
      driver: computed,
      authModel: computed,
      authModelLoading: computed,
      properties: computed,
      setDefaults: action,
    });
  }

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
    if (name !== 'name') {
      this.updateNameTemplate(this.model.connection);
    }
  };

  private setDefaults(prevDriverId: string | null) {
    this.setDefaultParameters(prevDriverId);
    this.cleanCredentials();
    this.model.connection.properties = {};
    this.model.connection.providerProperties = {};
    this.model.connection.authModel = this.driver?.defaultAuthModel;
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

    this.updateNameTemplate(this.model.connection);
  }

  private updateNameTemplate(connection: AdminConnectionFragment) {
    const isAutoFill = connection.name === this.prevGeneratedName || this.prevGeneratedName === null;

    if (this.model.editing || !isAutoFill) {
      return;
    }

    const isUrlConnection = !this.driver?.sampleURL;
    if (isUrlConnection) {
      this.prevGeneratedName = connection.url || '';
      connection.name = connection.url || '';
      return;
    }

    if (!this.driver) {
      connection.name = 'New connection';
      return;
    }

    let name = this.driver.name || '';
    if (connection.host) {
      name += '@' + connection.host.slice(0, this.maxHostLength);
      if (connection.port && connection.port !== this.driver.defaultPort) {
        name += ':' + connection.port;
      }
    }
    this.prevGeneratedName = name;
    connection.name = name;
  }

  private async loadDrivers() {
    try {
      await this.dbDriverResource.loadAll();
      await this.dbAuthModelsResource.load(
        this.model.connection.authModel || this.driver!.defaultAuthModel
      );
      this.setDefaultParameters();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load drivers');
    }
  }

  private async loadDriver(driverId: string | null, prev: string | null) {
    if (!driverId) {
      this.model.connection.authModel = undefined;
      return;
    }

    try {
      await this.dbDriverResource.load(driverId, ['providerProperties']);
      await this.dbAuthModelsResource.load(
        this.model.connection.authModel || this.driver!.defaultAuthModel
      );
      this.setDefaults(prev);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load driver ${driverId}`);
    }
  }
}
