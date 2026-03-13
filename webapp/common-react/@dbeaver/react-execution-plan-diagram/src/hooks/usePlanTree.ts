/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';

import { buildTree, filterVisibleNodes } from '../layout/buildTree.js';
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
    const { roots, nodeMap } = useMemo(() => buildTree(nodes), [nodes]);
    const collapsedNodes = useMemo(
        () => new Set(Array.from(rawCollapsedNodes).filter(nodeId => nodeMap.has(nodeId))),
        [nodeMap, rawCollapsedNodes],
    );
    const visibleNodes = useMemo(() => filterVisibleNodes(roots, collapsedNodes), [roots, collapsedNodes]);
    const heavyRouteIds = useMemo(() => (highlightHeavyRoute ? computeHeavyRoute(roots) : EMPTY_STRING_SET), [highlightHeavyRoute, roots]);

    return { nodeMap, collapsedNodes, visibleNodes, heavyRouteIds };
}
