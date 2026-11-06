/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useEffect, useState } from 'react';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { ExecutorHandlersCollection } from '@cloudbeaver/core-executor';

import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { tabSelectionContext } from '../Tabs/tabSelectionContext.js';

export interface IPanelFocusRequest {
  readonly tabId: string;
}

export interface IPanelActivation {
  readonly request: IPanelFocusRequest | null;
  completeRequest(request: IPanelFocusRequest): void;
}

interface IPanelActivationHost {
  isVisible(): boolean;
  reveal(): void;
}

export function usePanelActivation(
  container: TabsContainer,
  selection: { selectedTabId: string | undefined },
  host: IPanelActivationHost,
): IPanelActivation {
  const [beforeSelection] = useState(() => new ExecutorHandlersCollection<string>());
  const state = useObservableRef(
    () => ({
      request: null as IPanelFocusRequest | null,
      activate(tabId: string) {
        if (!this.container.getIdList().includes(tabId)) {
          return;
        }

        this.host.reveal();

        if (this.host.isVisible()) {
          this.request = { tabId };
        }
      },
      completeRequest(request: IPanelFocusRequest) {
        if (this.request === request) {
          this.request = null;
        }
      },
    }),
    {
      request: observable.ref,
      activate: action.bound,
      completeRequest: action.bound,
    },
    { container, selection, host },
  );

  useExecutor({
    executor: beforeSelection,
    handlers: [
      (tabId, contexts) => {
        contexts.getContext(tabSelectionContext).wasVisible = state.host.isVisible() && state.selection.selectedTabId === tabId;
      },
    ],
  });

  useExecutor({
    executor: container.onTabSelect,
    before: beforeSelection,
    handlers: [state.activate],
  });

  const request = state.request;
  const requestApplicable = !request || (container.getIdList().includes(request.tabId) && host.isVisible());

  useEffect(() => {
    if (request && !requestApplicable) {
      state.completeRequest(request);
    }
  }, [state, request, requestApplicable]);

  return state;
}
