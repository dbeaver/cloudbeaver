/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@dbeaver/core/di';

import { NodesManagerService } from './NodesManager/NodesManagerService';

export function useChildren(parentId = '/') {
  const nodesManagerService = useService(NodesManagerService);

  return nodesManagerService.getChildren(parentId);
}
