/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { memo, type ReactElement, type Ref } from 'react';
import type { ZoomTransform } from 'd3-zoom';

import type { ILayoutEdge } from '../layout/ILayoutEdge.js';
import type { ILayoutNode } from '../layout/ILayoutNode.js';
import type { IPlanFeatures } from '../types/IPlanFeatures.js';
import { usePlanKeyboardNavigation } from '../hooks/usePlanKeyboardNavigation.js';
import { PlanEdge } from './PlanEdge.js';
import { PlanNode } from './PlanNode.js';

import './PlanViewport.css';

export interface PlanViewportProps {
  containerRef: Ref<HTMLDivElement>;
  transform: ZoomTransform;
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

interface PlanViewportContentProps {
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

const PlanViewportContent = memo(function PlanViewportContent({
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
}: PlanViewportContentProps): ReactElement {
  const { activeNodeId, setNodeRef, handleNodeFocus, handleNodeKeyDown } = usePlanKeyboardNavigation({
    layoutNodes,
    selectedNodeId,
    onNodeSelect,
  });

  return (
    <>
      <svg className="dbv-plan-viewport__edges" width={contentWidth} height={contentHeight}>
        {layoutEdges.map(edge => (
          <PlanEdge
            key={`${edge.sourceId}-${edge.targetId}`}
            edge={edge}
            heavyRoute={heavyRouteIds.has(edge.sourceId) && heavyRouteIds.has(edge.targetId)}
            horizontal={horizontal}
          />
        ))}
      </svg>
      <div className="dbv-plan-viewport__nodes" role="listbox" aria-label="Execution plan nodes">
        {layoutNodes.map(layoutNode => (
          <PlanNode
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
            nodeRef={element => {
              setNodeRef(layoutNode.id, element);
            }}
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

export function PlanViewport({
  containerRef,
  transform,
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
}: PlanViewportProps): ReactElement {
  const transformStyle = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;

  return (
    <div ref={containerRef} className="dbv-plan-viewport" onClick={() => onNodeSelect(null)}>
      <div className="dbv-plan-viewport__content" style={{ transform: transformStyle }}>
        <PlanViewportContent
          layoutNodes={layoutNodes}
          layoutEdges={layoutEdges}
          contentWidth={contentWidth}
          contentHeight={contentHeight}
          features={features}
          selectedNodeId={selectedNodeId}
          heavyRouteIds={heavyRouteIds}
          collapsedNodes={collapsedNodes}
          collapseEnabled={collapseEnabled}
          horizontal={horizontal}
          onNodeSelect={onNodeSelect}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    </div>
  );
}
