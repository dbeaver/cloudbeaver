/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getProjectNodeId } from '@cloudbeaver/core-projects';
import { getPathParents } from '@cloudbeaver/core-utils';

import { isFolderNodeId } from './isFolderNodeId.js';

export function getFolderNodeParents(nodeId: string): string[] {
  if (isFolderNodeId(nodeId)) {
    const parents = getPathParents(nodeId);

    return [parents[0]!, getProjectNodeId(parents[1]!.replace('folder://', '')), ...parents.slice(2)];
  }

  return [];
}
