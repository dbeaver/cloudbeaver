/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getNodesFromContext } from '@cloudbeaver/core-navigation-tree';
import type { IDNDData } from '@cloudbeaver/core-ui';

export function isDraggingInsideProject(projectId: string, data: IDNDData[]) {
  if (!data.length) {
    return false;
  }

  for (const el of data) {
    const nodes = getNodesFromContext(el.context);
    const projectNode = nodes.some(node => node.projectId === projectId);

    if (projectNode) {
      return true;
    }
  }

  return false;
}