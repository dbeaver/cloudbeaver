/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';

import { DATA_CONTEXT_NAV_NODE } from './DATA_CONTEXT_NAV_NODE.js';
import { DATA_CONTEXT_NAV_NODES } from './DATA_CONTEXT_NAV_NODES.js';
import type { NavNode } from './EntityTypes.js';

export function getNodesFromContext(context: IDataContextProvider): NavNode[] {
  const node = context.get(DATA_CONTEXT_NAV_NODE);
  const getNodes = context.get(DATA_CONTEXT_NAV_NODES);
  let nodes = getNodes?.();

  if (!nodes || nodes.length < 2) {
    nodes = [];
  }

  if (node && !nodes.includes(node)) {
    nodes.push(node);
  }

  return nodes;
}
