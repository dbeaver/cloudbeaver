/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildTree, filterVisibleNodes, flattenTree } from '../layout/buildTree.js';
import { computeHeavyRoute } from '../layout/computeHeavyRoute.js';
import { computePlanLayout } from '../layout/computePlanLayout.js';
import type { ILayoutResult } from '../layout/ILayoutResult.js';
import { usePanZoom } from './usePanZoom.js';
import type { IPlanData } from '../types/IPlanData.js';
import type { IPlanDiagramCallbacks } from '../types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';
import type { IPlanNode } from '../types/IPlanNode.js';

import type { IToolbarActions } from '../components/DiagramContext.js';

export interface IExecutionPlanDiagramState {
    measureRef: React.RefObject<HTMLDivElement | null>;
    containerRef: React.RefCallback<HTMLDivElement>;
    transform: ReturnType<typeof usePanZoom>['transform'];
    layout: ILayoutResult | null;
    visibleNodes: IPlanNode[];
    selectedNodeId: string | null;
    heavyRouteIds: Set<string>;
    collapsedNodes: Set<string>;
    collapseEnabled: boolean;
    horizontal: boolean;
    toolbarActions: IToolbarActions | null;
    handleNodeSelect(nodeId: string | null): void;
    handleToggleCollapse(nodeId: string): void;
}

interface IUseExecutionPlanDiagramStateOptions extends IPlanDiagramCallbacks {
    data: IPlanData;
    options?: IPlanDiagramOptions;
    selectedNodeId?: string | null;
}

export function useExecutionPlanDiagramState({
    data,
    options,
    selectedNodeId: externalSelectedNodeId,
    onNodeSelect,
}: IUseExecutionPlanDiagramStateOptions): IExecutionPlanDiagramState {
    const [rawCollapsedNodes, setRawCollapsedNodes] = useState<Set<string>>(new Set());
    const [layout, setLayout] = useState<ILayoutResult | null>(null);
    const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null);
    const isSelectionControlled = externalSelectedNodeId !== undefined;
    const measureRef = useRef<HTMLDivElement>(null);
    const { transform, containerRef, zoomIn, zoomOut, fitToScreen, resetView } = usePanZoom();
    const direction = options?.direction ?? 'LR';
    const collapseEnabled = options?.enableCollapse ?? true;
    const highlightHeavyRoute = options?.highlightHeavyRoute ?? false;
    const horizontal = direction !== 'TB';

    const tree = useMemo(() => buildTree(data.nodes), [data.nodes]);
    const allNodes = useMemo(() => flattenTree(tree), [tree]);
    const nodeMap = useMemo(() => new Map(allNodes.map(node => [node.id, node])), [allNodes]);
    const collapsedNodes = useMemo(
        () => new Set(Array.from(rawCollapsedNodes).filter(nodeId => nodeMap.has(nodeId))),
        [nodeMap, rawCollapsedNodes],
    );
    const selectedNodeId = useMemo(() => {
        const nextSelectedNodeId = isSelectionControlled ? externalSelectedNodeId ?? null : internalSelectedNodeId;

        if (nextSelectedNodeId == null || !nodeMap.has(nextSelectedNodeId)) {
            return null;
        }

        return nextSelectedNodeId;
    }, [externalSelectedNodeId, internalSelectedNodeId, isSelectionControlled, nodeMap]);
    const visibleNodes = useMemo(() => filterVisibleNodes(allNodes, collapsedNodes), [allNodes, collapsedNodes]);
    const heavyRouteIds = useMemo(() => (highlightHeavyRoute ? computeHeavyRoute(tree) : new Set<string>()), [highlightHeavyRoute, tree]);

    const toolbarActions = useMemo<IToolbarActions | null>(
        () =>
            layout
                ? {
                    zoomIn,
                    zoomOut,
                    fitToScreen: () => fitToScreen(layout.width, layout.height),
                    resetView,
                }
                : null,
        [fitToScreen, layout, resetView, zoomIn, zoomOut],
    );

    useEffect(() => {
        const measureContainer = measureRef.current;

        if (!measureContainer) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            const nodeSizes = new Map<string, { width: number; height: number }>();

            for (const element of measureContainer.children) {
                const nodeId = (element as HTMLElement).dataset['nodeId'];

                if (nodeId) {
                    const rect = element.getBoundingClientRect();
                    nodeSizes.set(nodeId, { width: rect.width, height: rect.height });
                }
            }

            setLayout(computePlanLayout(visibleNodes, nodeSizes, { direction }));
        });

        return () => cancelAnimationFrame(frame);
    }, [direction, visibleNodes]);

    const handleNodeSelect = useCallback(
        (nodeId: string | null) => {
            if (nodeId == null) {
                if (!isSelectionControlled) {
                    setInternalSelectedNodeId(null);
                }

                onNodeSelect?.(null, null);
                return;
            }

            if (!isSelectionControlled) {
                setInternalSelectedNodeId(nodeId);
            }

            onNodeSelect?.(nodeId, nodeMap.get(nodeId) ?? null);
        },
        [isSelectionControlled, nodeMap, onNodeSelect],
    );

    const handleToggleCollapse = useCallback(
        (nodeId: string) => {
            if (!collapseEnabled) {
                return;
            }

            setRawCollapsedNodes(previous => {
                const next = new Set(previous);
                const wasCollapsed = next.has(nodeId);

                if (wasCollapsed) {
                    next.delete(nodeId);
                } else {
                    next.add(nodeId);
                }
                return next;
            });
        },
        [collapseEnabled],
    );

    return {
        measureRef,
        containerRef,
        transform,
        layout,
        visibleNodes,
        selectedNodeId,
        heavyRouteIds,
        collapsedNodes,
        collapseEnabled,
        horizontal,
        toolbarActions,
        handleNodeSelect,
        handleToggleCollapse,
    };
}