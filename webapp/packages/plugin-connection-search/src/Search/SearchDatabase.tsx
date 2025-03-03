/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, s, useResource, useS } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { ConnectionFormLoader } from '@cloudbeaver/plugin-connections';

import { ConnectionSearchService } from './ConnectionSearchService.js';
import { DatabaseList } from './DatabaseList.js';
import style from './SearchDatabase.module.css';

export const SearchDatabase: React.FC = observer(function SearchDatabase() {
  const styles = useS(style);
  const connectionSearchService = useService(ConnectionSearchService);

  useResource(SearchDatabase, ProjectInfoResource, CachedMapAllKey);
  useResource(SearchDatabase, DBDriverResource, CachedMapAllKey);

  function select(database: AdminConnectionSearchInfo) {
    connectionSearchService.select(database);
  }

  if (connectionSearchService.formState) {
    return (
      <Loader className={s(styles, { loader: true })} suspense>
        <ConnectionFormLoader
          formState={connectionSearchService.formState}
          onSave={() => connectionSearchService.saveConnection()}
          onCancel={() => connectionSearchService.goBack()}
        />
      </Loader>
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
