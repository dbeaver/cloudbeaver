/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import { ROOT_NODE_PATH } from './NodesManager/NavNodeInfoResource';
import { NavTreeResource } from './NodesManager/NavTreeResource';

export function useChildren(navNodeId = ROOT_NODE_PATH) {
  const navTreeResource = useService(NavTreeResource);
  const children = navTreeResource.get(navNodeId);
  const isLoading = navTreeResource.isDataLoading(navNodeId);
  const isLoaded = navTreeResource.isLoaded(navNodeId);
  const isOutdated = navTreeResource.isOutdated(navNodeId);

  return {
    children,
    isLoaded,
    isLoading,
    isOutdated,
  };
}
