/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeManagerService, DBObjectResource } from '@cloudbeaver/core-app';
import { useService } from '@cloudbeaver/core-di';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

export function useObjectFolder(objectId: string) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const dbObjectResource = useService(DBObjectResource);

  const children = navNodeManagerService.getTree(objectId) || [];

  const isLoading = !dbObjectResource.isLoaded(resourceKeyList(children))
      && dbObjectResource.isDataLoading(resourceKeyList(children));

  return { isLoading };
}
