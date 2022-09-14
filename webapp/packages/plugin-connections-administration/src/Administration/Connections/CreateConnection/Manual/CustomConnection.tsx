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

import { Loader, useMapResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource, PROJECT_GLOBAL_ID } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { ConnectionManualService } from './ConnectionManualService';
import { DriverList } from './DriverList';

export const CustomConnection = observer(function CustomConnection() {
  const connectionManualService = useService(ConnectionManualService);
  const dbDriverResource = useMapResource(CustomConnection, DBDriverResource, CachedMapAllKey);

  const drivers = useMemo(() => computed(() => (
    dbDriverResource.resource.enabledDrivers.slice().sort(dbDriverResource.resource.compare)
  )), [dbDriverResource]);

  useMapResource(CustomConnection, ProjectInfoResource, CachedMapAllKey);

  function select(driverId: string) {
    connectionManualService.select(PROJECT_GLOBAL_ID, driverId);
  }

  return (
    <Loader state={[dbDriverResource]}>
      <DriverList drivers={drivers.get()} onSelect={select} />
    </Loader>
  );
});
