/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { NavigationTreeService } from '../NavigationTree/NavigationTreeService';
import { ROOT_NODE_PATH } from './NodesManager/NavNodeInfoResource';
import { NavNodeViewService } from './NodesManager/NavNodeView/NavNodeViewService';
import { NavTreeResource } from './NodesManager/NavTreeResource';

interface Hook {
  children: string[] | undefined;
  exception: Error | null;
  limited: boolean;
  isLoaded: () => boolean;
  isLoading: () => boolean;
  isOutdated: () => boolean;
}

export function useChildren(navNodeId = ROOT_NODE_PATH): Hook {
  const navNodeViewService = useService(NavNodeViewService);
  const navTreeService = useService(NavigationTreeService);
  const navTreeResource = useService(NavTreeResource);
  let children = navTreeService.getChildren(navNodeId);
  let limited = false;
  const exception = navTreeResource.getException(navNodeId);

  if (children) {
    const data = navNodeViewService.limit(children);
    children = data.nodes;
    limited = data.truncated > 0;
  }

  const deps = [navNodeId];

  const isLoading = useCallback(() => navTreeResource.isDataLoading(navNodeId), deps);
  const isLoaded = useCallback(() => navTreeResource.isLoaded(navNodeId), deps);
  const isOutdated = useCallback(() => navTreeResource.isOutdated(navNodeId), deps);

  return {
    children,
    exception,
    limited,
    isLoaded,
    isLoading,
    isOutdated,
  };
}
