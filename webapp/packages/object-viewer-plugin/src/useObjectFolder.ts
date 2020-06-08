/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeManagerService, DBObjectService } from '@dbeaver/core/app';
import { useService } from '@dbeaver/core/di';


export function useObjectFolder(objectId: string) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const dbObjectService = useService(DBObjectService);

  const children = navNodeManagerService.getTree(objectId) || [];

  const isLoading = children.some(navNodeId => !dbObjectService.getDBObject(navNodeId))
      && dbObjectService.dbObject.isDataLoading({ navNodeId: children });

  return { isLoading };
}
