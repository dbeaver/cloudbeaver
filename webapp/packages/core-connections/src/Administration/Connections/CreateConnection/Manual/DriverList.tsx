/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState, useMemo } from 'react';

import { ItemListSearch, ItemList } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import type { DBDriver } from '../../../../DBDriverResource';
import { Driver } from './Driver';

interface Props {
  drivers: DBDriver[];
  className?: string;
  onSelect: (driverId: string) => void;
}

export const DriverList = observer(function DriverList({ drivers, className, onSelect }: Props) {
  const translate = useTranslate();
  const [search, setSearch] = useState('');
  const filteredDrivers = useMemo(() => {
    if (!search) {
      return drivers;
    }
    return drivers.filter(driver => driver.name?.toUpperCase().includes(search.toUpperCase()));
  }, [search, drivers]);

  return (
    <ItemList className={className}>
      <ItemListSearch value={search} placeholder={translate('connections_driver_search_placeholder')} onChange={setSearch} />
      {filteredDrivers.map(driver => <Driver key={driver.id} driver={driver} onSelect={onSelect} />)}
    </ItemList>
  );
});
