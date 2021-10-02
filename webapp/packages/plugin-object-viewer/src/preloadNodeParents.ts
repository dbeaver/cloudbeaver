/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-app';

export async function preloadNodeParents(
  navTreeResource: NavTreeResource,
  navNodeInfoResource: NavNodeInfoResource,
  parents: string[],
  nextNode?: string
): Promise<boolean> {
  if (parents.length === 0) {
    return true;
  }

  const first = parents[0];
  await navTreeResource.load(first);

  for (const nodeId of parents) {
    if (!navNodeInfoResource.has(nodeId)) {
      return false;
    }
    await navTreeResource.load(nodeId);
  }

  if (nextNode && !navNodeInfoResource.has(nextNode)) {
    return false;
  }

  return true;
}
