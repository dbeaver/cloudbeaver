/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { ConnectionsManagerService, DBDriver, DBDriverResource } from '@cloudbeaver/core-connections';
import { IInitializableController, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import { PublicConnectionFormService } from '@cloudbeaver/plugin-connections';

@injectable()
export class CustomConnectionController implements IInitializableController {
  isLoading: boolean;
  onClose!: () => void;

  get drivers(): DBDriver[] {
    return this.dbDriverResource.enabledDrivers;
  }

  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly notificationService: NotificationService,
    private readonly projectsService: ProjectsService,
    private readonly publicConnectionFormService: PublicConnectionFormService,
    private readonly connectionsManagerService: ConnectionsManagerService,
  ) {
    this.isLoading = true;

    makeObservable(this, {
      isLoading: observable,
      drivers: computed<DBDriver[]>({
        equals: isArraysEqual,
      }),
    });
  }

  init(onClose: () => void): void {
    this.loadDBDrivers();
    this.onClose = onClose;
  }

  onDriverSelect = async (driverId: string) => {
    await this.projectsService.load();

    const projects = this.connectionsManagerService.createConnectionProjects;

    if (projects.length === 0) {
      this.notificationService.logError({ title: 'core_projects_no_default_project' });
      return;
    }

    const state = await this.publicConnectionFormService.open(
      projects[0].id,
      { driverId },
      this.drivers.map(driver => driver.id),
    );

    if (state) {
      this.onClose();
    }
  };

  private async loadDBDrivers() {
    try {
      await this.dbDriverResource.load(CachedMapAllKey);
    } catch (exception: any) {
      this.notificationService.logException(exception, "Can't load database drivers");
    } finally {
      this.isLoading = false;
    }
  }
}
