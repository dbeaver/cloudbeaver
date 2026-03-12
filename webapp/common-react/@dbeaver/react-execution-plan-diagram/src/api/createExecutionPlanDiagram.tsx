/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createElement, useContext, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TranslateContext, type TranslateFn } from '@dbeaver/react-translate';

import { DiagramContext, type IToolbarActions } from '../components/DiagramContext.js';
import { ExecutionPlanDiagram } from '../components/ExecutionPlanDiagram.js';
import type { IPlanData } from '../types/IPlanData.js';
import type { IPlanDiagramCallbacks } from '../types/IPlanDiagramCallbacks.js';
import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';

export type IPlanTranslations = Record<string, string>;

/**
 * Imperative API for controlling the execution plan diagram from outside React.
 * Created by {@link createExecutionPlanDiagram}. In the standalone bundle,
 * these methods are also exposed as `window.*` globals (see standalone.tsx).
 */
export interface IExecutionPlanDiagramAPI {
  /** Replace the entire plan data. Clears selection if the selected node no longer exists. */
  setData(data: IPlanData): void;
  /** Merge new options into the current options (partial update). */
  setOptions(options: Partial<IPlanDiagramOptions>): void;
  /** Set i18n translations as a key→value map. */
  setTranslations(translations: IPlanTranslations): void;
  /** Select a node by ID, or pass null to clear selection. */
  selectNode(nodeId: string | null): void;
  /** Get the currently selected node ID, or null if nothing is selected. */
  getSelectedNodeId(): string | null;
  zoomIn(): void;
  zoomOut(): void;
  fitToScreen(): void;
  /** Reset zoom and pan to the initial state. */
  resetView(): void;
  /** Unmount the React tree and release resources. */
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
  translations: IPlanTranslations;
  toolbarActions: IToolbarActions | null;
}

function interpolateTranslation(template: string, args?: Record<string | number, any>): string {
  if (!args) {
    return template;
  }

  return template.replace(/\{arg:([^}]+)\}/g, (match, key) => {
    const value = args[key];
    return value == null ? match : String(value);
  });
}

function hasNode(data: IPlanData | null, nodeId: string | null): boolean {
  if (!data || nodeId == null) {
    return false;
  }

  return data.nodes.some(node => node.id === nodeId);
}

/**
 * Mount an execution plan diagram into a DOM container and return an imperative API.
 * This is the main entry point for non-React hosts (Java SWT Browser, plain HTML).
 *
 * @param container - DOM element to render into (e.g. `document.getElementById('plan-container')`)
 * @param initialData - plan data to display immediately (can also be set later via `api.setData()`)
 * @param options - layout and display options
 * @param callbacks - event callbacks (e.g. `onNodeSelect`)
 * @param translations - i18n key→value map for UI labels
 */
export function createExecutionPlanDiagram(
  container: HTMLElement,
  initialData?: IPlanData,
  options?: IPlanDiagramOptions,
  callbacks?: IPlanDiagramCallbacks,
  translations?: IPlanTranslations,
): IExecutionPlanDiagramAPI {
  let root: Root | null = createRoot(container);
  const state: IExecutionPlanDiagramState = {
    data: initialData ?? null,
    options: options ?? {},
    selectedNodeId: null,
    callbacks: callbacks ?? {},
    translations: translations ?? {},
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
        TranslateContext.Provider,
        {
          value: {
            translate: ((token, fallback, args) => {
              const key = token ? String(token) : undefined;
              const template = (key && state.translations[key]) || fallback || key;

              return (template ? interpolateTranslation(template, args) : template) as typeof token;
            }) as TranslateFn,
          },
        },
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
    setTranslations(translations: IPlanTranslations): void {
      state.translations = { ...translations };
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
