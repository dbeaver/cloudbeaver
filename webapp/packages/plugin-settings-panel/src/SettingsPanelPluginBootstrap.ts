/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export class SettingsPanelPluginBootstrapImpl extends Bootstrap {
  constructor() {
    super();
  }
}

export type SettingsPanelPluginBootstrap = SettingsPanelPluginBootstrapImpl;

export class SettingsPanelPluginBootstrapDI extends Context.Service<SettingsPanelPluginBootstrapDI, SettingsPanelPluginBootstrapImpl>()(
  '@cloudbeaver/plugin-settings-panel/SettingsPanelPluginBootstrap#SettingsPanelPluginBootstrap',
) {
  static readonly implementation = SettingsPanelPluginBootstrapImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SettingsPanelPluginBootstrapImpl, never, never> = Effect.sync(() => new SettingsPanelPluginBootstrapImpl());
  static readonly layer: Layer.Layer<SettingsPanelPluginBootstrapDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsPanelPluginBootstrap = SettingsPanelPluginBootstrapDI;
