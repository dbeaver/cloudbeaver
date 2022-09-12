/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { ConnectionForm } from '@cloudbeaver/plugin-connections';

import { ConnectionSearchService } from './ConnectionSearchService';
import { DatabaseList } from './DatabaseList';

export const SearchDatabase: React.FC = observer(function SearchDatabase() {
  const connectionSearchService = useService(ConnectionSearchService);

  function select(database: AdminConnectionSearchInfo) {
    connectionSearchService.select(database);
  }

  if (connectionSearchService.formState) {
    return (
      <ConnectionForm
        state={connectionSearchService.formState}
        onSave={() => connectionSearchService.saveConnection()}
        onCancel={() => connectionSearchService.goBack()}
      />
    );
  }

  return (
    <DatabaseList
      databases={connectionSearchService.databases}
      hosts={connectionSearchService.hosts}
      disabled={connectionSearchService.disabled}
      onSelect={select}
      onChange={connectionSearchService.change}
      onSearch={connectionSearchService.search}
    />
  );
});
