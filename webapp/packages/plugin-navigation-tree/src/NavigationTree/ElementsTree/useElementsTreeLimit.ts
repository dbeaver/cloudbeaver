/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

//@TODO probably backend should filter out these nodes and only return projects for the root node cause we dont show them anyway
const NON_PROJECT_NODES_COUNT = 3;

export function useElementsTreeLimit(root: string) {
  const navTreeResource = useService(NavTreeResource);

  const projectInfoResource = useResource(useElementsTreeLimit, ProjectInfoResource, CachedMapAllKey);
  const projects = projectInfoResource.data;

  const getLimit = useCallback(
    (nodeId: string) => {
      const count = projects.length + NON_PROJECT_NODES_COUNT + 1;
      if (nodeId === root && count > navTreeResource.childrenLimit) {
        return count;
      }

      return navTreeResource.childrenLimit;
    },
    [navTreeResource.childrenLimit, projects.length, root],
  );

  return [getLimit];
}
