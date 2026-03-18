/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { memo, type ReactElement } from 'react';
import { usePlanKeyboardNavigation } from '../hooks/usePlanKeyboardNavigation.js';
import { ExecutionPlanEdge } from './ExecutionPlanEdge.js';
import { ExecutionPlanNode } from './ExecutionPlanNode.js';
import type { ILayoutEdge } from '../layout/ILayoutEdge.js';
import type { ILayoutNode } from '../layout/ILayoutNode.js';
import type { IPlanFeatures } from '../types/IPlanFeatures.js';

import './ExecutionPlanViewportContent.css';

interface ExecutionPlanViewportContentProps {
  layoutNodes: ILayoutNode[];
  layoutEdges: ILayoutEdge[];
  contentWidth: number;
  contentHeight: number;
  features: IPlanFeatures;
  selectedNodeId: string | null;
  heavyRouteIds: Set<string>;
  collapsedNodes: Set<string>;
  collapseEnabled: boolean;
  horizontal?: boolean;
  onNodeSelect: (nodeId: string | null) => void;
  onToggleCollapse: (nodeId: string) => void;
}

export const ExecutionPlanViewportContent = memo(function ExecutionPlanViewportContent({
  layoutNodes,
  layoutEdges,
  contentWidth,
  contentHeight,
  features,
  selectedNodeId,
  heavyRouteIds,
  collapsedNodes,
  collapseEnabled,
  horizontal,
  onNodeSelect,
  onToggleCollapse,
}: ExecutionPlanViewportContentProps): ReactElement {
  const { activeNodeId, setNodeRef, handleNodeFocus, handleNodeKeyDown } = usePlanKeyboardNavigation({
    layoutNodes,
    selectedNodeId,
    onNodeSelect,
    onToggleCollapse,
  });

  return (
    <>
      <svg className="dbv-plan-viewport__edges" width={contentWidth} height={contentHeight}>
        {layoutEdges.map(edge => (
          <ExecutionPlanEdge
            key={`${edge.sourceId}-${edge.targetId}`}
            edge={edge}
            heavyRoute={heavyRouteIds.has(edge.sourceId) && heavyRouteIds.has(edge.targetId)}
            horizontal={horizontal}
          />
        ))}
      </svg>
      <div className="dbv-plan-viewport__nodes" role="listbox" aria-label="Execution plan nodes">
        {layoutNodes.map(layoutNode => (
          <ExecutionPlanNode
            ref={element => {
              setNodeRef(layoutNode.id, element);
            }}
            key={layoutNode.id}
            node={layoutNode.node}
            x={layoutNode.x}
            y={layoutNode.y}
            width={layoutNode.width}
            height={layoutNode.height}
            features={features}
            selected={selectedNodeId === layoutNode.id}
            heavyRoute={heavyRouteIds.has(layoutNode.id)}
            collapsed={collapsedNodes.has(layoutNode.id)}
            hasChildren={collapseEnabled && layoutNode.node.children != null && layoutNode.node.children.length > 0}
            horizontal={horizontal}
            tabIndex={activeNodeId === layoutNode.id ? 0 : -1}
            onFocus={handleNodeFocus}
            onKeyDown={event => {
              handleNodeKeyDown(event, layoutNode.id);
            }}
            onSelect={onNodeSelect}
            onToggleCollapse={onToggleCollapse}
          />
        ))}
      </div>
    </>
  );
});
