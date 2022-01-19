/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { NavNode } from './EntityTypes';
import { NavNodeInfoResource } from './NavNodeInfoResource';

interface IUseNodeHook {
  navNodeId: string;
  node: NavNode | undefined;
  isLoading: () => boolean;
  isLoaded: () => boolean;
  isOutdated: () => boolean;
}

const bindActions: Array<keyof IUseNodeHook> = ['isLoading', 'isLoaded', 'isOutdated'];

export function useNode(navNodeId: string): IUseNodeHook {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const node = navNodeInfoResource.get(navNodeId);

  return useObjectRef<IUseNodeHook>(() => ({
    navNodeId,
    node,
    isLoading() {
      return navNodeInfoResource.isDataLoading(this.navNodeId);
    },
    isLoaded() {
      return navNodeInfoResource.isLoaded(this.navNodeId);
    },
    isOutdated() {
      return navNodeInfoResource.isOutdated(this.navNodeId);
    },
  }), {
    navNodeId,
    node,
  }, bindActions);
}
