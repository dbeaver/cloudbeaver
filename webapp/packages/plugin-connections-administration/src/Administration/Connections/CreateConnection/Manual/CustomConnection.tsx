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

import { Loader } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';

import { ConnectionManualService } from './ConnectionManualService';
import { DriverList } from './DriverList';

export const CustomConnection = observer(function CustomConnection() {
  const service = useService(ConnectionManualService);
  const dbDriverResource = useService(DBDriverResource);

  const loading = dbDriverResource.isLoading();
  const drivers = useMemo(() => computed(() => (
    Array.from(dbDriverResource.data.values())
      .sort((a, b) => dbDriverResource.compare(a, b))
  )), [dbDriverResource.data]);

  if (loading) {
    return <Loader />;
  }

  return <DriverList drivers={drivers.get()} onSelect={service.select} />;
});
