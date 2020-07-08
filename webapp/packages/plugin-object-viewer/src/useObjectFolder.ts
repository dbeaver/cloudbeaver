/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeManagerService, DBObjectService } from '@cloudbeaver/core-app';
import { useService } from '@cloudbeaver/core-di';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

export function useObjectFolder(objectId: string) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const dbObjectService = useService(DBObjectService);

  const children = navNodeManagerService.getTree(objectId) || [];

  const isLoading = !dbObjectService.isLoaded(resourceKeyList(children))
      && dbObjectService.isDataLoading(resourceKeyList(children));

  return { isLoading };
}
