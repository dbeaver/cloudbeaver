/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useState, useMemo } from 'react';

import { DBDriver, DBSource } from '@dbeaver/core/app';
import { ItemList, ItemListSearch } from '@dbeaver/core/blocks';

import { DBSourceItem } from './DBSourceItem';

type DBSourceSelectorProps = {
  dbSources: DBSource[];
  dbDrivers: Map<string, DBDriver>;
  className?: string;
  onSelect(dbSourceId: string): void;
}

export const DBSourceSelector = observer(function DBSourceSelector({
  dbSources,
  dbDrivers,
  className,
  onSelect,
}: DBSourceSelectorProps) {
  const [search, setSearch] = useState('');
  const filteredDBSources = useMemo(() => {
    if (!search) {
      return dbSources;
    }
    return dbSources.filter(source => source.name.toUpperCase().includes(search.toUpperCase()));
  }, [search, dbSources]);

  return (
    <ItemList className={className}>
      <ItemListSearch onSearch={setSearch} />
      {filteredDBSources.map(dbSource => (
        <DBSourceItem
          key={dbSource.id}
          dbSource={dbSource}
          dbDriver={dbDrivers.get(dbSource.driverId)}
          onSelect={onSelect}
        />
      ))}
    </ItemList>
  );
});
