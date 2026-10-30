/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';

export function getSqlGenerationNodes<T extends Pick<NavNode, 'uri'>>(node: T | undefined, selected: readonly (T | undefined)[]): T[] {
  if (!node) {
    return [];
  }

  const nodes = selected.some(selectedNode => selectedNode?.uri === node.uri) ? selected.filter((node): node is T => !!node) : [node];

  return Array.from(new Map(nodes.map(node => [node.uri, node])).values());
}

export function haveSameSqlGenerationConnection(connections: readonly ({ id: string; projectId: string } | undefined)[]): boolean {
  const first = connections[0];
  return !!first && connections.every(connection => connection?.id === first.id && connection?.projectId === first.projectId);
}

export function isSqlGenerationNode(node: Pick<NavNode, 'objectFeatures'>): boolean {
  return node.objectFeatures.includes(EObjectFeature.entity) || node.objectFeatures.includes(EObjectFeature.script);
}
