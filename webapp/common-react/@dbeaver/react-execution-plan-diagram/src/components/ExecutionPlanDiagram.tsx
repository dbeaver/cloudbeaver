/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNodeSelection } from '../hooks/useNodeSelection.js';
import { usePanZoom } from '../hooks/usePanZoom.js';
import { buildTree, filterVisibleNodes, flattenTree } from '../layout/buildTree.js';
import { computeHeavyRoute } from '../layout/computeHeavyRoute.js';
import { computeNodeWidth } from '../layout/computeNodeDimensions.js';
import { computePlanLayout } from '../layout/computePlanLayout.js';
import type { ILayoutResult } from '../layout/ILayoutResult.js';
import type { IPlanData } from '../types/IPlanData.js';
import type { IPlanDiagramCallbacks } from '../types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';

import { PlanNode } from './PlanNode.js';
import { PlanToolbar } from './PlanToolbar.js';
import { PlanViewport } from './PlanViewport.js';

import './theme.css';
import './ExecutionPlanDiagram.css';

export interface ExecutionPlanDiagramProps extends IPlanDiagramCallbacks {
  data: IPlanData;
  options?: IPlanDiagramOptions;
  selectedNodeId?: string | null;
}

export function ExecutionPlanDiagram({
  data,
  options,
  selectedNodeId: externalSelectedNodeId,
  onNodeSelect: onNodeSelectCallback,
  onNodeExpand,
}: ExecutionPlanDiagramProps): ReactNode {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<ILayoutResult | null>(null);
  const [heavyRouteIds, setHeavyRouteIds] = useState<Set<string>>(new Set());
  const { selectedNodeId: internalSelectedNodeId, selectNode, clearSelection } = useNodeSelection();
  const selectedNodeId = externalSelectedNodeId !== undefined ? externalSelectedNodeId : internalSelectedNodeId;
  const measureRef = useRef<HTMLDivElement>(null);
  const panZoom = usePanZoom();

  const tree = useMemo(() => buildTree(data.nodes), [data.nodes]);
  const allNodes = useMemo(() => flattenTree(tree), [tree]);
  const visibleNodes = useMemo(() => filterVisibleNodes(allNodes, collapsedNodes), [allNodes, collapsedNodes]);

  // Pass 1: render nodes hidden, measure, then compute layout
  useEffect(() => {
    const measureContainer = measureRef.current;

    if (!measureContainer) {
      return;
    }

    // Wait one frame for the hidden nodes to render
    const frame = requestAnimationFrame(() => {
      const nodeSizes = new Map<string, { width: number; height: number }>();

      for (const el of measureContainer.children) {
        const id = (el as HTMLElement).dataset['nodeId'];

        if (id) {
          const rect = el.getBoundingClientRect();
          nodeSizes.set(id, { width: rect.width, height: rect.height });
        }
      }

      const result = computePlanLayout(visibleNodes, nodeSizes, options);
      setLayout(result);

      if (options?.highlightHeavyRoute) {
        setHeavyRouteIds(computeHeavyRoute(tree));
      } else {
        setHeavyRouteIds(new Set());
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [visibleNodes, tree, options]);

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (!nodeId) {
        clearSelection();
        return;
      }

      selectNode(nodeId);

      const node = layout?.nodes.find(n => n.id === nodeId);

      if (node && onNodeSelectCallback) {
        onNodeSelectCallback(nodeId, node.node);
      }
    },
    [layout?.nodes, onNodeSelectCallback, selectNode, clearSelection],
  );

  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      setCollapsedNodes(prev => {
        const next = new Set(prev);
        const wasCollapsed = next.has(nodeId);

        if (wasCollapsed) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }

        onNodeExpand?.(nodeId, wasCollapsed);
        return next;
      });
    },
    [onNodeExpand],
  );

  return (
    <div className={`dbv-plan-diagram ${options?.className ?? ''}`}>
      {/* Hidden measuring container: renders nodes to measure their real DOM size */}
      <div ref={measureRef} className="dbv-plan-diagram__measure">
        {visibleNodes.map(node => (
          <PlanNode key={node.id} node={node} x={0} y={0} width={computeNodeWidth(node)} height={0} features={data.features} />
        ))}
      </div>

      {layout && (
        <>
          <PlanViewport
            containerRef={panZoom.containerRef}
            transform={panZoom.transform}
            layoutNodes={layout.nodes}
            layoutEdges={layout.edges}
            contentWidth={layout.width}
            contentHeight={layout.height}
            features={data.features}
            selectedNodeId={selectedNodeId}
            heavyRouteIds={heavyRouteIds}
            collapsedNodes={collapsedNodes}
            horizontal={options?.direction !== 'TB'}
            onNodeSelect={handleNodeSelect}
            onToggleCollapse={handleToggleCollapse}
          />
          <PlanToolbar panZoom={panZoom} contentWidth={layout.width} contentHeight={layout.height} />
        </>
      )}
    </div>
  );
}
