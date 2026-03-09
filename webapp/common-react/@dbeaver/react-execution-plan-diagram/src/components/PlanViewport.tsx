/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ZoomTransform } from 'd3-zoom';

import type { ILayoutEdge } from '../layout/ILayoutEdge.js';
import type { ILayoutNode } from '../layout/ILayoutNode.js';
import type { IPlanFeatures } from '../types/IPlanFeatures.js';
import { PlanEdge } from './PlanEdge.js';
import { PlanNode } from './PlanNode.js';

import './PlanViewport.css';

export interface PlanViewportProps {
  containerRef: React.Ref<HTMLDivElement>;
  transform: ZoomTransform;
  layoutNodes: ILayoutNode[];
  layoutEdges: ILayoutEdge[];
  contentWidth: number;
  contentHeight: number;
  features: IPlanFeatures;
  selectedNodeId: string | null;
  heavyRouteIds: Set<string>;
  collapsedNodes: Set<string>;
  horizontal?: boolean;
  onNodeSelect: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
}

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
  horizontal,
  onNodeSelect,
  onToggleCollapse,
}: PlanViewportProps) {
  const transformStyle = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;

  return (
    <div ref={containerRef} className="dbv-plan-viewport" onClick={() => onNodeSelect('')}>
      <div className="dbv-plan-viewport__content" style={{ transform: transformStyle }}>
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
        <div className="dbv-plan-viewport__nodes">
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
              hasChildren={layoutNode.node.children != null && layoutNode.node.children.length > 0}
              horizontal={horizontal}
              onSelect={onNodeSelect}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
