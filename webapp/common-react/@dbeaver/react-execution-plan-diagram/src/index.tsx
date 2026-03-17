/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// Types
export { PlanNodeKind } from './types/PlanNodeKind.js';
export type { IPlanNode, IPlanNodeProperty } from './types/IPlanNode.js';
export type { IPlanData } from './types/IPlanData.js';
export type { IPlanFeatures } from './types/IPlanFeatures.js';
export type { IPlanDiagramOptions } from './types/IPlanDiagramOptions.js';
export type { IPlanDiagramCallbacks } from './types/IPlanDiagramCallbacks.js';

// Layout
export type { ILayoutNode } from './layout/ILayoutNode.js';
export type { ILayoutEdge } from './layout/ILayoutEdge.js';
export type { ILayoutResult } from './layout/ILayoutResult.js';
export { computePlanLayout } from './layout/computePlanLayout.js';
export { computeHeavyRoute } from './layout/computeHeavyRoute.js';
export { computeNodeWidth } from './layout/computeNodeDimensions.js';
export { buildTree, filterVisibleNodes } from './layout/buildTree.js';
export type { IPlanTreeData } from './layout/buildTree.js';

// Hooks
export { usePanZoom } from './hooks/usePanZoom.js';

// Components
export { ExecutionPlanDiagram } from './components/ExecutionPlanDiagram.js';
export type { IExecutionPlanDiagramProps } from './components/ExecutionPlanDiagram.js';
export { useDiagramActions } from './components/DiagramContext.js';
export type { IDiagramActions } from './components/DiagramContext.js';

// Imperative API (for Java bridge / standalone usage)
export { createExecutionPlanDiagram } from './api/createExecutionPlanDiagram.js';
export type { IExecutionPlanDiagramAPI } from './api/createExecutionPlanDiagram.js';
