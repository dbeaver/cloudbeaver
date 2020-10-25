/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { NavNodeInfoResource } from './NavNodeInfoResource';

export function useNode(navNodeId: string) {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const node = navNodeInfoResource.get(navNodeId);

  const deps = [navNodeId];

  const isLoading = useCallback(() => navNodeInfoResource.isDataLoading(navNodeId), deps);
  const isLoaded = useCallback(() => navNodeInfoResource.isLoaded(navNodeId), deps);
  const isOutdated = useCallback(() => navNodeInfoResource.isOutdated(navNodeId), deps);

  return {
    node, isLoading, isLoaded, isOutdated,
  };
}
