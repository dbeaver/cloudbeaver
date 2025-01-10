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

import { Driver, type IDriver } from './Driver.js';
import style from './DriverSelector.module.css';

interface Props {
  drivers: IDriver[];
  className?: string;
  onSelect: (driverId: string) => void;
}

export const DriverSelector = observer<Props>(function DriverSelector({ drivers, className, onSelect }) {
  const styles = useS(style);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const [search, setSearch] = useState('');
  const filteredDrivers = useMemo(() => {
    if (!search) {
      return drivers;
    }
    return drivers.filter(driver => driver.name?.toUpperCase().includes(search.toUpperCase()));
  }, [search, drivers]);

  return (
    <div ref={focusedRef} className={s(styles, { wrapper: true })}>
      <ItemListSearch placeholder={translate('connections_driver_search_placeholder')} onChange={setSearch} />
      <ItemList className={className}>
        {filteredDrivers.map(driver => (
          <Driver key={driver.id} driver={driver} onSelect={onSelect} />
        ))}
      </ItemList>
    </div>
  );
});
