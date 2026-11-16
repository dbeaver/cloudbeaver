/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';

import { ToolsPanelSettingsService } from '../ToolsPanelSettingsService.js';

export class ToolsPanelServiceImpl {
  readonly tabsContainer: TabsContainer;

  get disabled(): boolean {
    return this.toolsPanelSettingsService.disabled;
  }

  constructor(private readonly toolsPanelSettingsService: ToolsPanelSettingsService) {
    this.tabsContainer = new TabsContainer('Tools');

    makeObservable(this, {
      disabled: computed,
    });
  }
}

export type ToolsPanelService = ToolsPanelServiceImpl;

export class ToolsPanelServiceDI extends Context.Service<ToolsPanelServiceDI, ToolsPanelServiceImpl>()(
  '@cloudbeaver/plugin-tools-panel/ToolsPanel/ToolsPanelService#ToolsPanelService',
) {
  static readonly implementation = ToolsPanelServiceImpl;

  static readonly dependencies = () => [ToolsPanelSettingsService] as const;
  static readonly make: Effect.Effect<ToolsPanelServiceImpl, never, Context.Service.Identifier<typeof ToolsPanelSettingsService>> = Effect.gen(
    function* makeToolsPanelService() {
      const toolsPanelSettingsService = yield* ToolsPanelSettingsService;

      return new ToolsPanelServiceImpl(toolsPanelSettingsService);
    },
  );
  static readonly layer: Layer.Layer<ToolsPanelServiceDI, never, Context.Service.Identifier<typeof ToolsPanelSettingsService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ToolsPanelService = ToolsPanelServiceDI;
