/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { Loader, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { ConnectionManualService } from './ConnectionManualService';
import { DriverList } from './DriverList';

export const CustomConnection = observer(function CustomConnection() {
  const projectsService = useService(ProjectsService);
  const notificationService = useService(NotificationService);
  const connectionManualService = useService(ConnectionManualService);
  const dbDriverResource = useResource(CustomConnection, DBDriverResource, CachedMapAllKey);

  const drivers = useMemo(() => computed(() => (
    dbDriverResource.resource.enabledDrivers.slice().sort(dbDriverResource.resource.compare)
  )), [dbDriverResource]);

  useResource(CustomConnection, ProjectInfoResource, CachedMapAllKey);

  function select(driverId: string) {
    if (projectsService.activeProjects.length > 0) {
      connectionManualService.select(projectsService.activeProjects[0].id, driverId);
    } else {
      notificationService.logError({
        title: 'core_projects_no_default_project',
      });
    }
  }

  return (
    <Loader state={[dbDriverResource]}>
      <DriverList drivers={drivers.get()} onSelect={select} />
    </Loader>
  );
});
