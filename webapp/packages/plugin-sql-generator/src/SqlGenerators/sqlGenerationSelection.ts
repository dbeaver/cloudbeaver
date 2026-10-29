/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { SqlQueryGenerator } from '@cloudbeaver/core-sdk';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature, type NavNode, type NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { DATA_CONTEXT_ELEMENTS_TREE } from '@cloudbeaver/plugin-navigation-tree';

export function getSqlGenerationNodes(context: IDataContextProvider, navNodeInfoResource: NavNodeInfoResource): NavNode[] {
  const node = context.get(DATA_CONTEXT_NAV_NODE);
  if (!node) {
    return [];
  }

  // Use the tree selection, as node deletion does: node menus do not always expose DATA_CONTEXT_NAV_NODES.
  const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);
  const nodes = tree?.isNodeSelected(node.uri)
    ? tree
        .getSelected()
        .map(id => navNodeInfoResource.get(id))
        .filter((node): node is NavNode => !!node)
    : [navNodeInfoResource.get(node.uri) ?? node];
  return Array.from(new Map(nodes.map(node => [node.uri, node])).values());
}

export function haveSameSqlGenerationConnection(connections: readonly ({ id: string; projectId: string } | undefined)[]): boolean {
  const first = connections[0];
  return !!first && connections.every(connection => connection?.id === first.id && connection?.projectId === first.projectId);
}

export function isSqlGenerationNode(node: NavNode): boolean {
  return node.objectFeatures.includes(EObjectFeature.entity) || node.objectFeatures.includes(EObjectFeature.script);
}

/** Individual discovery preserves existing generators, including driver contributions, without introducing JOIN actions. */
export function getSqlGenerationActions(generators: readonly (readonly SqlQueryGenerator[])[]): SqlQueryGenerator[] {
  const candidates = new Map(generators.flatMap(list => list.map(generator => [generator.id, generator] as const)));
  return Array.from(candidates.values());
}
