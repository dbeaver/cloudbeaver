/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';

export interface ISidebarActivationHost {
  isVisible(): boolean;
  reveal(): void;
}

export interface ISidebarActivationRequest {
  readonly tabId: string;
}

@injectable()
export class SidebarActivationService {
  private readonly hosts = new Map<TabsContainer, ISidebarActivationHost>();
  private readonly panels = new Map<TabsContainer, () => string | undefined>();
  private readonly requests = observable.map<TabsContainer, ISidebarActivationRequest>(undefined, { deep: false });

  constructor() {
    makeObservable(this, {
      reveal: action,
      completeRequest: action,
    });
  }

  registerHost(container: TabsContainer, host: ISidebarActivationHost): () => void {
    this.hosts.set(container, host);

    return action(() => {
      if (this.hosts.get(container) === host) {
        this.hosts.delete(container);
        this.requests.delete(container);
      }
    });
  }

  registerPanel(container: TabsContainer, getSelectedTabId: () => string | undefined): () => void {
    this.panels.set(container, getSelectedTabId);

    return () => {
      if (this.panels.get(container) === getSelectedTabId) {
        this.panels.delete(container);
      }
    };
  }

  reveal(tabId: string): boolean {
    const container = this.findContainer(tabId);

    if (!container) {
      return false;
    }

    this.requests.set(container, { tabId });
    this.hosts.get(container)!.reveal();

    return true;
  }

  isRevealed(tabId: string): boolean {
    const container = this.findContainer(tabId);

    return !!container && !!this.hosts.get(container)?.isVisible() && this.panels.get(container)?.() === tabId;
  }

  getRequest(container: TabsContainer): ISidebarActivationRequest | undefined {
    return this.requests.get(container);
  }

  completeRequest(container: TabsContainer, request: ISidebarActivationRequest): void {
    if (this.requests.get(container) === request) {
      this.requests.delete(container);
    }
  }

  private findContainer(tabId: string): TabsContainer | undefined {
    const containers = Array.from(this.hosts.keys()).filter(container => {
      const info = container.getTabInfo(tabId);
      return container.getIdList().includes(tabId) && !info?.isDisabled?.(tabId);
    });

    return containers.length === 1 ? containers[0] : undefined;
  }
}
