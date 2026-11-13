/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';

export class LeftBarPanelServiceImpl {
  readonly tabsContainer: TabsContainer;

  constructor() {
    this.tabsContainer = new TabsContainer('Left Side Bar');
  }
}

export type LeftBarPanelService = LeftBarPanelServiceImpl;

export class LeftBarPanelServiceDI extends Context.Service<LeftBarPanelServiceDI, LeftBarPanelServiceImpl>()(
  '@cloudbeaver/core-ui/SideBarPanel/LeftBarPanelService#LeftBarPanelService',
) {
  static readonly implementation = LeftBarPanelServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<LeftBarPanelServiceImpl, never, never> = Effect.sync(() => new LeftBarPanelServiceImpl());
  static readonly layer: Layer.Layer<LeftBarPanelServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LeftBarPanelService = LeftBarPanelServiceDI;
