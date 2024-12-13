/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { PublicConnectionFormService } from '@cloudbeaver/plugin-connections';

interface State {
  select(driverId: string): Promise<void>;
}

type Args = {
  drivers: string[];
  onSelect?: () => void;
  projectId: string | undefined;
  folderPath: string | undefined;
};

export function useDriverSelectorDialog({ drivers, onSelect, projectId, folderPath }: Args) {
  const notificationService = useService(NotificationService);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const publicConnectionFormService = useService(PublicConnectionFormService);

  const state: State = useObservableRef(
    () => ({
      async select(driverId: string) {
        const projects = this.connectionsManagerService.createConnectionProjects;

        if (projects.length === 0) {
          this.notificationService.logError({ title: 'core_projects_no_default_project' });
          return;
        }

        const selectedProjectId = projects.find(project => project.id === projectId)?.id || projects[0]!.id;
        const state = await this.publicConnectionFormService.open(selectedProjectId, { driverId, folder: folderPath }, this.drivers);

        if (state) {
          onSelect?.();
        }
      },
    }),
    { select: action.bound },
    { drivers, notificationService, connectionsManagerService, publicConnectionFormService },
  );

  return state;
}
