/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';
import type { SqlQueryGenerator } from '@cloudbeaver/core-sdk';

import { isSqlGenerationNode } from './sqlGenerationSelection.js';

interface ISqlGenerationAction<T> {
  generator: SqlQueryGenerator;
  nodes: T[];
}

export function getSqlGenerationActions<T extends Pick<NavNode, 'objectFeatures'>>(
  nodes: readonly T[],
  generators: readonly SqlQueryGenerator[],
): ISqlGenerationAction<T>[] {
  const supported = nodes.filter(isSqlGenerationNode);
  const entities = supported.filter(node => node.objectFeatures.includes(EObjectFeature.entity));

  return generators.flatMap(generator => {
    // The server may offer JOIN for mixed selections, but JOIN generators expect only entities.
    const isJoin = generator.id === 'tableJoin' || generator.id === 'tableInnerJoin';
    const selected = isJoin ? entities : supported;

    // Count eligible entities, not all selected objects (e.g. a table and a procedure).
    if (selected.length === 0 || ((isJoin || generator.multiObject) && selected.length < 2)) {
      return [];
    }

    return [{ generator, nodes: selected }];
  });
}
