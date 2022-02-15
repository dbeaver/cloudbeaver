/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState, useMemo } from 'react';
import styled, { css } from 'reshadow';

import { ItemListSearch, ItemList, useFocus } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { Driver, IDriver } from './Driver';

interface Props {
  drivers: IDriver[];
  className?: string;
  onSelect: (driverId: string) => void;
}

const style = css`
  div {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
`;

export const DriverSelector = observer<Props>(function DriverSelector({ drivers, className, onSelect }) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const [search, setSearch] = useState('');
  const filteredDrivers = useMemo(() => {
    if (!search) {
      return drivers;
    }
    return drivers.filter(driver => driver.name?.toUpperCase().includes(search.toUpperCase()));
  }, [search, drivers]);

  return styled(style)(
    <div ref={focusedRef}>
      <ItemListSearch placeholder={translate('connections_driver_search_placeholder')} onChange={setSearch} />
      <ItemList className={className}>
        {filteredDrivers.map(driver => <Driver key={driver.id} driver={driver} onSelect={onSelect} />)}
      </ItemList>
    </div>
  );
});
