/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import { NavNodeManagerService } from './NavNodeManagerService';

export function useNode(navNodeId: string) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const node = navNodeManagerService.getNode(navNodeId);
  const isLoading = navNodeManagerService.navNode.isDataLoading({
    navNodeId: [navNodeId],
  });
  const isLoaded = navNodeManagerService.navNode.isLoaded({
    navNodeId: [navNodeId],
  });

  return {
    node, isLoading, isLoaded,
  };
}
