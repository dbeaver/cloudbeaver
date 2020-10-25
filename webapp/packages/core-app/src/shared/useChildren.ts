/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { ROOT_NODE_PATH } from './NodesManager/NavNodeInfoResource';
import { NavTreeResource } from './NodesManager/NavTreeResource';

interface Hook {
  children: string[] | undefined;
  isLoaded: () => boolean;
  isLoading: () => boolean;
  isOutdated: () => boolean;
}

export function useChildren(navNodeId = ROOT_NODE_PATH): Hook {
  const navTreeResource = useService(NavTreeResource);
  const children = navTreeResource.get(navNodeId);

  const deps = [navNodeId];

  const isLoading = useCallback(() => navTreeResource.isDataLoading(navNodeId), deps);
  const isLoaded = useCallback(() => navTreeResource.isLoaded(navNodeId), deps);
  const isOutdated = useCallback(() => navTreeResource.isOutdated(navNodeId), deps);

  return {
    children,
    isLoaded,
    isLoading,
    isOutdated,
  };
}
