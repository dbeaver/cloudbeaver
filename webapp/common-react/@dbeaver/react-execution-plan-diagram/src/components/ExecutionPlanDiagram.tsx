/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type ReactNode } from 'react';

import { useExecutionPlanDiagramState } from '../hooks/useExecutionPlanDiagramState.js';
import { computeNodeWidth, PLAN_NODE_MAX_WIDTH } from '../layout/computeNodeDimensions.js';
import type { IPlanData } from '../types/IPlanData.js';
import type { IPlanDiagramCallbacks } from '../types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';

import { DiagramContext } from './DiagramContext.js';
import { PlanNode } from './PlanNode.js';
import { PlanViewport } from './PlanViewport.js';

import './theme.css';
import './ExecutionPlanDiagram.css';

export interface ExecutionPlanDiagramProps extends IPlanDiagramCallbacks {
  data: IPlanData;
  options?: IPlanDiagramOptions;
  selectedNodeId?: string | null;
  children?: ReactNode;
}

export function ExecutionPlanDiagram({
  data,
  options,
  selectedNodeId: externalSelectedNodeId,
  children,
  onNodeSelect,
}: ExecutionPlanDiagramProps): ReactNode {
  const {
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
    diagramActions,
    handleNodeSelect,
    handleToggleCollapse,
  } = useExecutionPlanDiagramState({
    data,
    options,
    selectedNodeId: externalSelectedNodeId,
    onNodeSelect,
  });

  return (
    <DiagramContext.Provider value={diagramActions}>
      <div className={`dbv-plan-diagram ${options?.className ?? ''}`}>
        {/* Hidden measuring container: renders nodes to measure their real DOM size */}
        <div ref={measureRef} className="dbv-plan-diagram__measure">
          {visibleNodes.map(node => (
            <PlanNode
              key={node.id}
              node={node}
              x={0}
              y={0}
              minWidth={computeNodeWidth(node)}
              maxWidth={PLAN_NODE_MAX_WIDTH}
              height={0}
              features={data.features}
            />
          ))}
        </div>

        {layout && (
          <>
            <PlanViewport
              containerRef={containerRef}
              transform={transform}
              layoutNodes={layout.nodes}
              layoutEdges={layout.edges}
              contentWidth={layout.width}
              contentHeight={layout.height}
              features={data.features}
              selectedNodeId={selectedNodeId}
              heavyRouteIds={heavyRouteIds}
              collapsedNodes={collapsedNodes}
              collapseEnabled={collapseEnabled}
              horizontal={horizontal}
              onNodeSelect={handleNodeSelect}
              onToggleCollapse={handleToggleCollapse}
            />
            {children}
          </>
        )}
      </div>
    </DiagramContext.Provider>
  );
}
