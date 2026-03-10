/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createExecutionPlanDiagram, type IExecutionPlanDiagramAPI } from './api/createExecutionPlanDiagram.js';
import type { IPlanData } from './types/IPlanData.js';
import type { IPlanDiagramCallbacks } from './types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from './types/IPlanDiagramOptions.js';

declare global {
  interface Window {
    createExecutionPlanDiagram: (data?: IPlanData, options?: IPlanDiagramOptions, callbacks?: IPlanDiagramCallbacks) => boolean;
    setPlanData: (data: IPlanData) => void;
    setPlanOptions: (options: Partial<IPlanDiagramOptions>) => void;
    selectPlanNode: (nodeId: string | null) => void;
    getSelectedPlanNodeId: () => string | null;
    planZoomIn: () => void;
    planZoomOut: () => void;
    planFitToScreen: () => void;
    planResetView: () => void;
    disposePlanDiagram: () => void;
    __planDiagram: IExecutionPlanDiagramAPI | null;
    __PLAN_INIT_DATA__?: IPlanData;
    __PLAN_INIT_OPTIONS__?: IPlanDiagramOptions;
  }
}

const container = document.getElementById('plan-container');

if (container) {
  window.createExecutionPlanDiagram = (data, options, callbacks) => {
    window.__planDiagram = createExecutionPlanDiagram(container, data, options, callbacks);
    return true;
  };

  window.setPlanData = data => window.__planDiagram?.setData(data);
  window.setPlanOptions = options => window.__planDiagram?.setOptions(options);
  window.selectPlanNode = nodeId => window.__planDiagram?.selectNode(nodeId);
  window.getSelectedPlanNodeId = () => window.__planDiagram?.getSelectedNodeId() ?? null;
  window.planZoomIn = () => window.__planDiagram?.zoomIn();
  window.planZoomOut = () => window.__planDiagram?.zoomOut();
  window.planFitToScreen = () => window.__planDiagram?.fitToScreen();
  window.planResetView = () => window.__planDiagram?.resetView();
  window.disposePlanDiagram = () => window.__planDiagram?.dispose();

  // Auto-initialize if data is preset (e.g. set by Java before page load)
  if (window.__PLAN_INIT_DATA__) {
    window.createExecutionPlanDiagram(window.__PLAN_INIT_DATA__, window.__PLAN_INIT_OPTIONS__);
  }
}
