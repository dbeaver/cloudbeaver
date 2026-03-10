/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createElement, useContext, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { DiagramContext, type IToolbarActions } from '../components/DiagramContext.js';
import { ExecutionPlanDiagram } from '../components/ExecutionPlanDiagram.js';
import type { IPlanData } from '../types/IPlanData.js';
import type { IPlanDiagramCallbacks } from '../types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';

export interface IExecutionPlanDiagramAPI {
  setData(data: IPlanData): void;
  setOptions(options: Partial<IPlanDiagramOptions>): void;
  selectNode(nodeId: string | null): void;
  getSelectedNodeId(): string | null;
  zoomIn(): void;
  zoomOut(): void;
  fitToScreen(): void;
  resetView(): void;
  dispose(): void;
}

/** Invisible child component that captures toolbar actions from DiagramContext. */
function ActionsCapture({ onActions }: { onActions: (actions: IToolbarActions | null) => void }) {
  const actions = useContext(DiagramContext);

  useEffect(() => {
    onActions(actions);
  }, [actions, onActions]);

  return null;
}

interface IExecutionPlanDiagramState {
  data: IPlanData | null;
  options: IPlanDiagramOptions;
  selectedNodeId: string | null;
  callbacks: IPlanDiagramCallbacks;
  toolbarActions: IToolbarActions | null;
}

function hasNode(data: IPlanData | null, nodeId: string | null): boolean {
  if (!data || nodeId == null) {
    return false;
  }

  return data.nodes.some(node => node.id === nodeId);
}

export function createExecutionPlanDiagram(
  container: HTMLElement,
  initialData?: IPlanData,
  options?: IPlanDiagramOptions,
  callbacks?: IPlanDiagramCallbacks,
): IExecutionPlanDiagramAPI {
  let root: Root | null = createRoot(container);
  const state: IExecutionPlanDiagramState = {
    data: initialData ?? null,
    options: options ?? {},
    selectedNodeId: null,
    callbacks: callbacks ?? {},
    toolbarActions: null,
  };

  function render(): void {
    if (!root) {
      return;
    }

    if (!state.data) {
      root.render(null);
      return;
    }

    root.render(
      createElement(
        ExecutionPlanDiagram,
        {
          data: state.data,
          options: state.options,
          selectedNodeId: state.selectedNodeId,
          onNodeSelect: (nodeId, node) => {
            state.selectedNodeId = nodeId;
            state.callbacks.onNodeSelect?.(nodeId, node);

            if (typeof (globalThis as any).onPlanNodeSelected === 'function') {
              (globalThis as any).onPlanNodeSelected(nodeId);
            }

            render();
          },
        },
        createElement(ActionsCapture, {
          onActions: actions => {
            state.toolbarActions = actions;
          },
        }),
      ),
    );
  }

  render();

  const api: IExecutionPlanDiagramAPI = {
    setData(data: IPlanData): void {
      state.data = data;
      state.selectedNodeId = hasNode(data, state.selectedNodeId) ? state.selectedNodeId : null;
      render();
    },
    setOptions(options: Partial<IPlanDiagramOptions>): void {
      state.options = { ...state.options, ...options };
      render();
    },
    selectNode(nodeId: string | null): void {
      state.selectedNodeId = hasNode(state.data, nodeId) ? nodeId : null;
      render();
    },
    getSelectedNodeId(): string | null {
      return state.selectedNodeId;
    },
    zoomIn(): void {
      state.toolbarActions?.zoomIn();
    },
    zoomOut(): void {
      state.toolbarActions?.zoomOut();
    },
    fitToScreen(): void {
      state.toolbarActions?.fitToScreen();
    },
    resetView(): void {
      state.toolbarActions?.resetView();
    },
    dispose(): void {
      if (root) {
        root.unmount();
        root = null;
      }

      state.toolbarActions = null;
    },
  };

  return api;
}
