/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';

import { useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionsManagerService, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { PublicConnectionFormService } from '@cloudbeaver/plugin-connections';

import type { IDriver } from './Driver.js';

interface State {
  select(driverId: string): Promise<void>;
  enabledDrivers: IDriver[];
}

interface DriverSelectorDialogArgs {
  onSelect?: () => void;
  projectId: string | undefined;
  folderPath: string | undefined;
}

export function useDriverSelectorDialog({ onSelect, projectId, folderPath }: DriverSelectorDialogArgs) {
  const notificationService = useService(NotificationService);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const publicConnectionFormService = useService(PublicConnectionFormService);
  const dbDriverResource = useResource(useDriverSelectorDialog, DBDriverResource, CachedMapAllKey);
  const enabledDrivers = dbDriverResource.resource.enabledDrivers;

  const state: State = useObservableRef(
    () => ({
      async select(driverId: string) {
        const projects = this.connectionsManagerService.createConnectionProjects;
        const drivers = this.enabledDrivers.map(driver => driver.id);

        if (projects.length === 0) {
          this.notificationService.logError({ title: 'core_projects_no_default_project' });
          return;
        }

        const selectedProjectId = projects.find(project => project.id === projectId)?.id || projects[0]!.id;
        const state = await this.publicConnectionFormService.open(selectedProjectId, { driverId, folder: folderPath }, drivers);

        if (state) {
          onSelect?.();
        }
      },
    }),
    { select: action.bound, enabledDrivers: observable.ref },
    { notificationService, connectionsManagerService, publicConnectionFormService, enabledDrivers },
  );

  return state;
}
