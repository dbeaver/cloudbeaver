/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { useMemo, useEffect } from 'react';

import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { DBDriverResource } from '../../../DBDriverResource';
import { DriverList } from './DriverList';

type Props = {
  className?: string;
  onSelect(driverId: string): void;
}

export const CustomConnection = observer(function CustomConnection({
  className,
  onSelect,
}: Props) {
  const dbDriverResource = useService(DBDriverResource);

  useEffect(() => { dbDriverResource.loadAll(); }, []);
  const loading = dbDriverResource.isLoading();
  const drivers = useMemo(() => computed(() => (
    Array.from(dbDriverResource.data.values())
      .sort((a, b) => dbDriverResource.compare(a, b))
  )), [dbDriverResource.data]);

  if (loading) {
    return <Loader className={className}/>;
  }

  return <DriverList drivers={drivers.get()} onSelect={onSelect} className={className}/>;
});
