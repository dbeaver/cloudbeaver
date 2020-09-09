/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { IProperty } from '@cloudbeaver/core-blocks';
import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { DriverPropertiesService } from '../../../../DriverPropertiesService';

type StaticId = {
  staticId: string;
}

export type DriverPropertyInfoWithStaticId = ObjectPropertyInfo & StaticId

@injectable()
export class DriverPropertiesController implements IInitializableController {
  @observable isLoading = false;
  @observable hasDetails = false
  @observable responseMessage: string | null = null
  @observable driverProperties = observable<IProperty>([])
  @observable driverId!: string

  loaded = false;

  private state!: Record<string, string>;

  constructor(
    private driverPropertiesService: DriverPropertiesService,
    private notificationService: NotificationService
  ) { }

  init(driverId: string, state: Record<string, string>) {
    this.driverId = driverId;
    this.state = state;
  }

  addProperty = (key?: string, value?: string) => {
    this.driverProperties.unshift({
      id: uuid(),
      key: key ?? 'property',
      defaultValue: value ?? '',
      new: !key,
    });
  }

  async loadDriverProperties() {
    if (this.isLoading || this.loaded) {
      return;
    }
    this.isLoading = true;
    try {
      const driverProperties = await this.driverPropertiesService.loadDriverProperties(this.driverId);
      this.driverProperties = observable(driverProperties.map(property => ({
        id: property.id!,
        key: property.id!,
        displayName: property.displayName!,
        defaultValue: property.defaultValue,
        description: property.description,
        validValues: property.validValues,
      })));

      for (const key of Object.keys(this.state)) {
        if (this.driverProperties.some(property => property.key === key)) {
          continue;
        }

        this.addProperty(key, this.state[key]);
      }
      this.loaded = true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver properties');
    } finally {
      this.isLoading = false;
    }
  }
}
