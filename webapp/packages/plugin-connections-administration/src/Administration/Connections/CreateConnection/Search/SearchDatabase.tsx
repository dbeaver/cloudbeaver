/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';


import { useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ProjectsResource, PROJECT_GLOBAL_ID } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, type AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';

import { CustomConnection } from '../Manual/CustomConnection';
import { ConnectionSearchService } from './ConnectionSearchService';
import { DatabaseList } from './DatabaseList';

export const SearchDatabase: React.FC = observer(function SearchDatabase() {
  const connectionSearchService = useService(ConnectionSearchService);
  useMapResource(CustomConnection, ProjectsResource, CachedMapAllKey);

  function select(database: AdminConnectionSearchInfo) {
    connectionSearchService.select(PROJECT_GLOBAL_ID, database);
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
