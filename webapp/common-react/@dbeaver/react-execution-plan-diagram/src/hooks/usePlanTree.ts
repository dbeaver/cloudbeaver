/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';

import { buildTree, filterVisibleNodes, flattenTree } from '../layout/buildTree.js';
import { computeHeavyRoute } from '../layout/computeHeavyRoute.js';
import type { IPlanNode } from '../types/IPlanNode.js';

const EMPTY_STRING_SET = new Set<string>();

export interface IPlanTree {
    nodeMap: Map<string, IPlanNode>;
    collapsedNodes: Set<string>;
    visibleNodes: IPlanNode[];
    heavyRouteIds: Set<string>;
}

export function usePlanTree(
    nodes: IPlanNode[],
    rawCollapsedNodes: Set<string>,
    highlightHeavyRoute: boolean,
): IPlanTree {
    const tree = useMemo(() => buildTree(nodes), [nodes]);
    const allNodes = useMemo(() => flattenTree(tree), [tree]);
    const nodeMap = useMemo(() => new Map(allNodes.map(node => [node.id, node])), [allNodes]);
    const collapsedNodes = useMemo(
        () => new Set(Array.from(rawCollapsedNodes).filter(nodeId => nodeMap.has(nodeId))),
        [nodeMap, rawCollapsedNodes],
    );
    const visibleNodes = useMemo(() => filterVisibleNodes(tree, collapsedNodes), [tree, collapsedNodes]);
    const heavyRouteIds = useMemo(() => (highlightHeavyRoute ? computeHeavyRoute(tree) : EMPTY_STRING_SET), [highlightHeavyRoute, tree]);

    return { nodeMap, collapsedNodes, visibleNodes, heavyRouteIds };
}
