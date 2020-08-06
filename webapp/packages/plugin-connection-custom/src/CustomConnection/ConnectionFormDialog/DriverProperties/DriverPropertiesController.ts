/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { IProperty } from '@cloudbeaver/core-blocks';
import { DBDriver } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { CustomConnectionService } from '../../../CustomConnectionService';

export type DriverPropertyState = {
  [key: string]: string;
}

type StaticId = {
  staticId: string;
}

export type DriverPropertyInfoWithStaticId = ObjectPropertyInfo & StaticId

@injectable()
export class DriverPropertiesController implements IInitializableController {
  @observable isLoading = false;
  @observable driver!: DBDriver
  @observable hasDetails = false
  @observable responseMessage: string | null = null
  @observable driverProperties = observable<IProperty>([])

  private loaded = false;

  constructor(private customConnectionService: CustomConnectionService,
    private notificationService: NotificationService) { }

  init(driver: DBDriver) {
    this.driver = driver;
  }

  onAddProperty = () => {
    this.driverProperties.unshift({
      id: uuid(),
      key: 'property',
      defaultValue: '',
    });
  }

  async loadDriverProperties() {
    if (this.isLoading || this.loaded) {
      return;
    }
    this.isLoading = true;
    try {
      const driverProperties = await this.customConnectionService.loadDriverProperties(this.driver.id);
      this.driverProperties = observable(driverProperties.map(property => ({
        id: property.id!,
        key: property.id!,
        displayName: property.displayName!,
        defaultValue: property.defaultValue,
        description: property.description,
        validValues: property.validValues,
      })));
      this.loaded = true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver properties');
    } finally {
      this.isLoading = false;
    }
  }
}
