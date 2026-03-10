/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react';

import type { ILayoutNode } from '../layout/ILayoutNode.js';
import { findClosestNodeInDirection, type Direction } from './spatialNavigation.js';

interface IUsePlanKeyboardNavigationOptions {
    layoutNodes: ILayoutNode[];
    selectedNodeId: string | null;
    onNodeSelect: (nodeId: string | null) => void;
}
export interface IPlanKeyboardNavigation {
    activeNodeId: string | null;
    setNodeRef(nodeId: string, element: HTMLDivElement | null): void;
    handleNodeFocus(nodeId: string): void;
    handleNodeKeyDown(event: KeyboardEvent<HTMLDivElement>, nodeId: string): void;
}

export function usePlanKeyboardNavigation({
    layoutNodes,
    selectedNodeId,
    onNodeSelect,
}: IUsePlanKeyboardNavigationOptions): IPlanKeyboardNavigation {
    const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [lastFocusedNodeId, setLastFocusedNodeId] = useState<string | null>(null);
    const nodeCenters = useMemo(
        () => new Map(layoutNodes.map(node => [node.id, { x: node.x + node.width / 2, y: node.y + node.height / 2 }])),
        [layoutNodes],
    );

    const activeNodeId = useMemo(() => {
        if (selectedNodeId && nodeCenters.has(selectedNodeId)) {
            return selectedNodeId;
        }

        if (lastFocusedNodeId && nodeCenters.has(lastFocusedNodeId)) {
            return lastFocusedNodeId;
        }

        return layoutNodes[0]?.id ?? null;
    }, [lastFocusedNodeId, layoutNodes, nodeCenters, selectedNodeId]);

    const setNodeRef = useCallback((nodeId: string, element: HTMLDivElement | null) => {
        if (element) {
            nodeRefs.current.set(nodeId, element);
            return;
        }

        nodeRefs.current.delete(nodeId);
    }, []);

    const focusNode = useCallback((nodeId: string) => {
        setLastFocusedNodeId(nodeId);
        requestAnimationFrame(() => {
            nodeRefs.current.get(nodeId)?.focus();
        });
    }, []);

    const findAdjacentNodeId = useCallback(
        (nodeId: string, direction: Direction): string | null => findClosestNodeInDirection(nodeId, nodeCenters, direction),
        [nodeCenters],
    );

    const handleNodeFocus = useCallback((nodeId: string) => {
        setLastFocusedNodeId(nodeId);
    }, []);

    const handleNodeKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>, nodeId: string) => {
            switch (event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    onNodeSelect(nodeId);
                    return;
                case 'Escape':
                    event.preventDefault();
                    onNodeSelect(null);
                    return;
                case 'Home': {
                    const firstNodeId = layoutNodes[0]?.id;

                    if (firstNodeId) {
                        event.preventDefault();
                        onNodeSelect(firstNodeId);
                        focusNode(firstNodeId);
                    }
                    return;
                }
                case 'End': {
                    const lastNodeId = layoutNodes.at(-1)?.id;

                    if (lastNodeId) {
                        event.preventDefault();
                        onNodeSelect(lastNodeId);
                        focusNode(lastNodeId);
                    }
                    return;
                }
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowUp':
                case 'ArrowDown': {
                    event.preventDefault();
                    const direction = event.key.replace('Arrow', '').toLowerCase() as Direction;
                    const nextNodeId = findAdjacentNodeId(nodeId, direction);

                    if (nextNodeId) {
                        onNodeSelect(nextNodeId);
                        focusNode(nextNodeId);
                    }
                    return;
                }
            }
        },
        [findAdjacentNodeId, focusNode, layoutNodes, onNodeSelect],
    );

    return {
        activeNodeId,
        setNodeRef,
        handleNodeFocus,
        handleNodeKeyDown,
    };
}