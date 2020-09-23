/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useState, useMemo } from 'react';

import { ItemList, ItemListSearch } from '@cloudbeaver/core-blocks';
import { DBDriver, Connection } from '@cloudbeaver/core-connections';

import { TemplateConnectionItem } from './TemplateConnectionItem';

type Props = {
  templateConnections: Connection[];
  dbDrivers: Map<string, DBDriver>;
  className?: string;
  onSelect(dbSourceId: string): void;
}

export const TemplateConnectionSelector = observer(function TemplateConnectionSelector({
  templateConnections,
  dbDrivers,
  className,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const filteredTemplateConnections = useMemo(() => {
    if (!search) {
      return templateConnections;
    }
    return templateConnections.filter(template => template.name.toUpperCase().includes(search.toUpperCase()));
  }, [search, templateConnections]);

  return (
    <ItemList className={className}>
      <ItemListSearch onChange={setSearch} />
      {filteredTemplateConnections.map(template => (
        <TemplateConnectionItem
          key={template.id}
          template={template}
          dbDriver={dbDrivers.get(template.driverId)}
          onSelect={onSelect}
        />
      ))}
    </ItemList>
  );
});
