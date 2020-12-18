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
import { DatabaseAuthModel, ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { DatabaseAuthModelsResource } from '../../../../DatabaseAuthModelsResource';
import { DBDriver, DBDriverResource } from '../../../../DBDriverResource';
import { IConnectionFormModel } from '../IConnectionFormModel';

/** we want to save prev connection parameters to detect if user changed "name" field to turn off autofill */
interface IPrevConnectionParameters {
  host?: string;
  port?: string;
  url?: string;
}
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

  @computed get properties(): ObjectPropertyInfo[] | undefined {
    if (this.model.connection.authProperties.length) {
      return this.model.connection.authProperties;
    }
    return this.authModel?.properties;
  }

  private model!: IConnectionFormModel;
  private prevConnectionParameters: IPrevConnectionParameters = {};
  private maxHostLength = 20;

  constructor(
    private notificationService: NotificationService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private dbDriverResource: DBDriverResource,
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
    this.updateName(name);
  };

  @action
  private setDefaults(prevDriverId: string | null) {
    this.setDefaultParameters(prevDriverId);
    this.cleanCredentials();
    this.model.connection.properties = {};
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

    this.prevConnectionParameters.host = this.model.connection.host;
    this.prevConnectionParameters.port = this.model.connection.port;
    this.prevConnectionParameters.url = this.model.connection.url;

    if (!this.model.editing) {
      if (this.model.connection.url && !this.model.connection.host && !this.model.connection.port) {
        this.model.connection.name = this.model.connection.url;
      } else {
        this.model.connection.name = this.getNameTemplate(this.model.connection.host, this.model.connection.port);
      }
    }
  }

  private updateName(name?: string) {
    if (name === 'name') {
      return;
    }

    const host = this.model.connection.host;
    const port = this.model.connection.port;
    const url = this.model.connection.url || '';
    const prevHost = this.prevConnectionParameters.host;
    const prevPort = this.prevConnectionParameters.port;
    const prevUrl = this.prevConnectionParameters.url;

    if (url && !host && !port && this.model.connection.name === prevUrl) {
      this.model.connection.name = url;
      this.prevConnectionParameters.url = url;
      return;
    }

    if (this.model.connection.name === this.getNameTemplate(prevHost, prevPort)) {
      this.model.connection.name = this.getNameTemplate(host, port);
      this.prevConnectionParameters.host = host;
      this.prevConnectionParameters.port = port;
    }
  }

  private getNameTemplate(host?: string, port?: string) {
    if (this.driver) {
      let address = '';
      if (host) {
        address += host.length > this.maxHostLength ? host.slice(0, this.maxHostLength) : host;
        if (port && port !== this.driver.defaultPort) {
          address += `:${port}`;
        }
      }

      return `${this.driver.name}${address ? '@' + address : ''}`;
    }

    return 'New connection';
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
      await this.dbDriverResource.load(driverId);
      await this.dbAuthModelsResource.load(
        this.model.connection.authModel || this.driver!.defaultAuthModel
      );
      this.setDefaults(prev);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load driver ${driverId}`);
    }
  }
}
