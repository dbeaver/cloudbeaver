/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import { DBObjectService } from './DBObjectService';

export function useDatabaseObjectInfo(navNodeId: string) {
  const dbObjectService = useService(DBObjectService);
  const dbObject = dbObjectService.get(navNodeId);
  const isLoading = dbObjectService.isDataLoading(navNodeId);
  const isLoaded = dbObjectService.isLoaded(navNodeId);

  return { dbObject, isLoading, isLoaded };
}
