/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import { NavNodeInfoResource } from './NavNodeInfoResource';

export function useNode(navNodeId: string) {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const node = navNodeInfoResource.get(navNodeId);
  const isLoading = navNodeInfoResource.isDataLoading(navNodeId);
  const isLoaded = navNodeInfoResource.isLoaded(navNodeId);
  const isOutdated = navNodeInfoResource.isOutdated(navNodeId);

  return {
    node, isLoading, isLoaded, isOutdated,
  };
}
