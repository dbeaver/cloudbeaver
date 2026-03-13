/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ILayoutResult } from '../layout/ILayoutResult.js';
import type { IPlanData } from '../types/IPlanData.js';
import type { IPlanDiagramCallbacks } from '../types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';
import type { IPlanNode } from '../types/IPlanNode.js';
import { useCollapseState } from './useCollapseState.js';
import { usePlanLayout } from './usePlanLayout.js';
import { usePlanSelection } from './usePlanSelection.js';
import { usePlanTree } from './usePlanTree.js';

export interface IExecutionPlanDiagramState {
    measureRef: React.RefObject<HTMLDivElement | null>;
    layout: ILayoutResult | null;
    visibleNodes: IPlanNode[];
    selectedNodeId: string | null;
    heavyRouteIds: Set<string>;
    collapsedNodes: Set<string>;
    collapseEnabled: boolean;
    horizontal: boolean;
    handleNodeSelect(nodeId: string | null): void;
    handleToggleCollapse(nodeId: string): void;
}

interface IUseExecutionPlanDiagramStateOptions extends IPlanDiagramCallbacks {
    data: IPlanData;
    options?: IPlanDiagramOptions;
    selectedNodeId?: string | null;
    onLayoutComputed?: (width: number, height: number) => void;
}

export function useExecutionPlanDiagramState({
    data,
    options,
    selectedNodeId: externalSelectedNodeId,
    onNodeSelect,
    onLayoutComputed,
}: IUseExecutionPlanDiagramStateOptions): IExecutionPlanDiagramState {
    const direction = options?.direction ?? 'LR';
    const collapseEnabled = options?.enableCollapse ?? true;
    const highlightHeavyRoute = options?.highlightHeavyRoute ?? false;
    const horizontal = direction !== 'TB';

    const { rawCollapsedNodes, handleToggleCollapse } = useCollapseState(collapseEnabled);
    const { nodeMap, collapsedNodes, visibleNodes, heavyRouteIds } = usePlanTree(data.nodes, rawCollapsedNodes, highlightHeavyRoute);
    const { selectedNodeId, handleNodeSelect } = usePlanSelection(nodeMap, externalSelectedNodeId, onNodeSelect);
    const { layout, measureRef } = usePlanLayout(visibleNodes, direction, onLayoutComputed);

    return {
        measureRef,
        layout,
        visibleNodes,
        selectedNodeId,
        heavyRouteIds,
        collapsedNodes,
        collapseEnabled,
        horizontal,
        handleNodeSelect,
        handleToggleCollapse,
    };
}
