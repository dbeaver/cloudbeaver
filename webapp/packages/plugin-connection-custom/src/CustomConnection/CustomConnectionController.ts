/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { DBDriver, DBDriverResource } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { PublicConnectionFormService } from '@cloudbeaver/plugin-connections';

@injectable()
export class CustomConnectionController implements IInitializableController {
  isLoading = true;
  onClose!: () => void;

  get drivers(): DBDriver[] {
    return this.dbDriverResource.values
      .sort(this.dbDriverResource.compare);
  }

  constructor(
    private dbDriverResource: DBDriverResource,
    private notificationService: NotificationService,
    private readonly publicConnectionFormService: PublicConnectionFormService
  ) {
    makeObservable(this, {
      isLoading: observable,
      drivers: computed,
    });
  }

  init(onClose: () => void): void {
    this.loadDBDrivers();
    this.onClose = onClose;
  }

  onDriverSelect = async (driverId: string) => {
    const state = await this.publicConnectionFormService.open(
      { driverId },
      this.dbDriverResource.keys
    );

    if (state) {
      this.onClose();
    }
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
}
