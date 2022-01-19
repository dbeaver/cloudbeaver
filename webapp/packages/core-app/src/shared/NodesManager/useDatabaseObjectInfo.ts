/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import { DBObjectResource } from './DBObjectResource';

export function useDatabaseObjectInfo(navNodeId: string) {
  const dbObjectResource = useService(DBObjectResource);
  const dbObject = dbObjectResource.get(navNodeId);
  const isLoading = dbObjectResource.isDataLoading(navNodeId);
  const isLoaded = dbObjectResource.isLoaded(navNodeId);

  return { dbObject, isLoading, isLoaded };
}
