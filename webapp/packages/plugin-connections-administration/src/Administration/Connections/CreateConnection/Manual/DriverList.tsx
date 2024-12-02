/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { ItemList, ItemListSearch, s, useFocus, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { DBDriver } from '@cloudbeaver/core-connections';

import { Driver } from './Driver.js';
import styles from './DriverList.module.css';

interface Props {
  drivers: DBDriver[];
  className?: string;
  onSelect: (driverId: string) => void;
}

export const DriverList = observer<Props>(function DriverList({ drivers, className, onSelect }) {
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const translate = useTranslate();
  const [search, setSearch] = useState('');
  const style = useS(styles);
  const filteredDrivers = useMemo(() => {
    if (!search) {
      return drivers;
    }
    return drivers.filter(driver => driver.name?.toUpperCase().includes(search.toUpperCase()));
  }, [search, drivers]);

  return (
    <div ref={focusedRef} className={s(style, { container: true })}>
      <ItemListSearch value={search} placeholder={translate('connections_driver_search_placeholder')} onChange={setSearch} />
      <ItemList className={className}>
        {filteredDrivers.map(driver => (
          <Driver key={driver.id} driver={driver} onSelect={onSelect} />
        ))}
      </ItemList>
    </div>
  );
});
