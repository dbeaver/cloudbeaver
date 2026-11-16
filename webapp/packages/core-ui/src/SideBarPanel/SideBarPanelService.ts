/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';

export class SideBarPanelServiceImpl {
  readonly tabsContainer: TabsContainer;

  constructor() {
    this.tabsContainer = new TabsContainer('Right Side Bar');
  }
}

export type SideBarPanelService = SideBarPanelServiceImpl;

export class SideBarPanelServiceDI extends Context.Service<SideBarPanelServiceDI, SideBarPanelServiceImpl>()(
  '@cloudbeaver/core-ui/SideBarPanel/SideBarPanelService#SideBarPanelService',
) {
  static readonly implementation = SideBarPanelServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SideBarPanelServiceImpl, never, never> = Effect.sync(() => new SideBarPanelServiceImpl());
  static readonly layer: Layer.Layer<SideBarPanelServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SideBarPanelService = SideBarPanelServiceDI;
