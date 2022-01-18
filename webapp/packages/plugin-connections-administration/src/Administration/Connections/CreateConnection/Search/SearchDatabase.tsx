/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';

import { ConnectionSearchService } from './ConnectionSearchService';
import { DatabaseList } from './DatabaseList';

export const SearchDatabase: React.FC = observer(function SearchDatabase() {
  const service = useService(ConnectionSearchService);

  return (
    <DatabaseList
      databases={service.databases}
      hosts={service.hosts}
      disabled={service.disabled}
      onSelect={service.select}
      onChange={service.change}
      onSearch={service.search}
    />
  );
});
