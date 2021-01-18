/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { IProperty } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { DriverPropertiesService } from '../../../../DriverPropertiesService';

interface StaticId {
  staticId: string;
}

export type DriverPropertyInfoWithStaticId = ObjectPropertyInfo & StaticId;

@injectable()
export class DriverPropertiesController {
  isLoading = false;
  hasDetails = false;
  responseMessage: string | null = null;
  driverProperties = observable<IProperty>([]);
  driverId!: string;

  loaded = false;

  private state!: Record<string, string>;

  constructor(
    private driverPropertiesService: DriverPropertiesService,
    private notificationService: NotificationService
  ) {
    makeObservable(this, {
      isLoading: observable,
      hasDetails: observable,
      responseMessage: observable,
      driverProperties: observable,
      driverId: observable,
    });
  }

  update(driverId: string, state: Record<string, string>): void {
    this.driverId = driverId;
    this.state = state;
  }

  addProperty = (key?: string, value?: string) => {
    this.driverProperties.unshift({
      id: uuid(),
      key: key ?? '',
      defaultValue: value ?? '',
      keyPlaceholder: 'property',
      new: !key,
    });
  };

  loadDriverProperties = async () => {
    if (this.isLoading || this.loaded) {
      return;
    }
    this.isLoading = true;
    try {
      const driverProperties = await this.driverPropertiesService.loadDriverProperties(this.driverId);
      this.driverProperties = observable(driverProperties.map<IProperty>(property => ({
        id: property.id!,
        key: property.id!,
        keyPlaceholder: property.id,
        displayName: property.displayName,
        valuePlaceholder: property.defaultValue,
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
  };
}
