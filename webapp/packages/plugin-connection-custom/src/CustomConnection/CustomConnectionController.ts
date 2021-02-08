/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { DBDriver, DBDriverResource } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

export enum ConnectionStep {
  Driver,
  Connection
}

@injectable()
export class CustomConnectionController implements IInitializableController {
  step = ConnectionStep.Driver;
  isLoading = true;
  driver: DBDriver | null = null;

  get drivers(): DBDriver[] {
    return Array
      .from(this.dbDriverResource.data.values())
      .sort((a, b) => this.sortDrivers(a, b));
  }

  constructor(
    private dbDriverResource: DBDriverResource,
    private notificationService: NotificationService
  ) {
    makeObservable(this, {
      step: observable,
      isLoading: observable,
      driver: observable,
      drivers: computed,
    });
  }

  init() {
    this.loadDBDrivers();
  }

  onStep = (step: ConnectionStep) => {
    this.step = step;
  };

  onDriverSelect = (driverId: string) => {
    this.driver = this.dbDriverResource.get(driverId)!;

    this.step = ConnectionStep.Connection;
  };

  private async loadDBDrivers() {
    try {
      await this.dbDriverResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load database drivers');
    } finally {
      this.isLoading = false;
    }
  }

  private sortDrivers(driverA: DBDriver, driverB: DBDriver): number {
    if (driverA.promotedScore === driverB.promotedScore) {
      return (driverA.name || '').localeCompare((driverB.name || ''));
    }

    return (driverB.promotedScore || 0) - (driverA.promotedScore || 0);
  }
}
