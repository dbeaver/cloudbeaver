/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { SQLCodeEditorPanelService } from './SQLEditor/SQLCodeEditorPanel/SQLCodeEditorPanelService.js';

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly sqlCodeEditorPanelService: SQLCodeEditorPanelService) {
    super();
  }

  override register(): void | Promise<void> {
    this.sqlCodeEditorPanelService.registerPanel();
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-editor-new/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [SQLCodeEditorPanelService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof SQLCodeEditorPanelService>> = Effect.gen(
    function* makePluginBootstrap() {
      const sqlCodeEditorPanelService = yield* SQLCodeEditorPanelService;

      return new PluginBootstrapImpl(sqlCodeEditorPanelService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof SQLCodeEditorPanelService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
