/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action } from 'mobx';

import { DBDriver } from '@dbeaver/core/app';
import { injectable, IInitializableController } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { DriverPropertyInfo } from '@dbeaver/core/sdk';
import { uuid } from '@dbeaver/core/utils';

import { CustomConnectionService } from '../../../CustomConnectionService';

export type DriverPropertyState = {
  [key: string]: string;
}

type StaticId = {
  staticId: string;
}

export type DriverPropertyInfoWithStaticId = DriverPropertyInfo & StaticId

@injectable()
export class DriverPropertiesController implements IInitializableController {
  @observable isLoading = false;
  @observable driver!: DBDriver
  @observable hasDetails = false
  @observable responseMessage: string | null = null
  @observable driverProperties = observable<DriverPropertyInfoWithStaticId>([])
  @observable state: DriverPropertyState = {}

  private loaded = false;

  constructor(private customConnectionService: CustomConnectionService,
    private notificationService: NotificationService) { }

  init(driver: DBDriver, state: DriverPropertyState) {
    this.driver = driver;
    this.state = state;
  }

  getPropertyIdCount(propertyId: string): number {
    return this.driverProperties.filter(property => property.id === propertyId).length;
  }

  onAddProperty = () => {
    this.driverProperties.unshift({
      staticId: uuid(),
      id: 'property',
    });
  }

  onValueChange = (staticId: string, value: string) => {
    const property = this.driverProperties.find(property => property.staticId === staticId);

    if (!property) {
      return;
    }

    this.state[property.id] = value;
  }

  @action
  onNameChange = (staticId: string, newId: string) => {
    const property = this.driverProperties.find(property => property.staticId === staticId);

    if (!property) {
      return;
    }

    if (this.state[property.id] !== undefined) {
      this.state[newId] = this.state[property.id];
      delete this.state[property.id];
    }

    property.id = newId;
  }

  @action
  onRemove = (staticId: string) => {
    const property = this.driverProperties.find(property => property.staticId === staticId);

    if (!property) {
      return;
    }

    if (this.state[property.id] !== undefined) {
      delete this.state[property.id];
    }
    this.driverProperties.remove(property);
  }

  async loadDriverProperties() {
    if (this.isLoading || this.loaded) {
      return;
    }
    this.isLoading = true;
    try {
      const driverProperties = await this.customConnectionService.loadDriverProperties(this.driver.id);
      this.driverProperties = observable(driverProperties.map(property => ({ ...property, staticId: property.id })));
      this.loaded = true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver properties');
    } finally {
      this.isLoading = false;
    }
  }
}
