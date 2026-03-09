/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';

import type { IPlanData } from '../types/IPlanData.js';
import type { IPlanDiagramCallbacks } from '../types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';
import type { IPlanNode } from '../types/IPlanNode.js';
import { ExecutionPlanDiagram } from '../components/ExecutionPlanDiagram.js';

export interface IExecutionPlanDiagramAPI {
  setData(data: IPlanData): void;
  setOptions(options: Partial<IPlanDiagramOptions>): void;
  selectNode(nodeId: string): void;
  getSelectedNodeId(): string | null;
  dispose(): void;
}

interface DiagramState {
  data: IPlanData | null;
  options: IPlanDiagramOptions;
  selectedNodeId: string | null;
  callbacks: IPlanDiagramCallbacks;
}

export function createExecutionPlanDiagram(
  container: HTMLElement,
  initialData?: IPlanData,
  options?: IPlanDiagramOptions,
): IExecutionPlanDiagramAPI {
  let root: Root | null = createRoot(container);

  const state: DiagramState = {
    data: initialData ?? null,
    options: options ?? {},
    selectedNodeId: null,
    callbacks: {},
  };

  function render(): void {
    if (!root || !state.data) {
      return;
    }

    root.render(
      createElement(ExecutionPlanDiagram, {
        data: state.data,
        options: state.options,
        onNodeSelect: (nodeId: string, node: IPlanNode) => {
          state.selectedNodeId = nodeId;
          state.callbacks.onNodeSelect?.(nodeId, node);

          // Call global function if registered by Java via BrowserFunction
          if (typeof (globalThis as any).onPlanNodeSelected === 'function') {
            (globalThis as any).onPlanNodeSelected(nodeId);
          }
        },
        onNodeExpand: (nodeId: string, expanded: boolean) => {
          state.callbacks.onNodeExpand?.(nodeId, expanded);

          if (typeof (globalThis as any).onPlanNodeExpand === 'function') {
            (globalThis as any).onPlanNodeExpand(nodeId, expanded);
          }
        },
      }),
    );
  }

  if (state.data) {
    render();
  }

  const api: IExecutionPlanDiagramAPI = {
    setData(data: IPlanData): void {
      state.data = data;
      render();
    },
    setOptions(options: Partial<IPlanDiagramOptions>): void {
      state.options = { ...state.options, ...options };
      render();
    },
    selectNode(nodeId: string): void {
      state.selectedNodeId = nodeId;
    },
    getSelectedNodeId(): string | null {
      return state.selectedNodeId;
    },
    dispose(): void {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  };

  return api;
}
