/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ConnectionAiSettingsService } from './connection-ai-settings/ConnectionAiSettingsService.js';
import { AIChatScopeService } from './connection-custom-scope/ai-chat/AIChatScopeService.js';
import { ConnectionAiScopeService } from './connection-custom-scope/connection-ai-settings/ConnectionAiScopeService.js';

export class PluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly connectionAiSettingsService: ConnectionAiSettingsService,
    private readonly aiChatScopeService: AIChatScopeService,
    private readonly connectionAiScopeService: ConnectionAiScopeService,
  ) {
    super();
  }

  override register(): void {
    this.connectionAiSettingsService.register();
    this.aiChatScopeService.register();
    this.connectionAiScopeService.register();
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-connection-ai/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [ConnectionAiSettingsService, AIChatScopeService, ConnectionAiScopeService] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ConnectionAiSettingsService>
    | Context.Service.Identifier<typeof AIChatScopeService>
    | Context.Service.Identifier<typeof ConnectionAiScopeService>
  > = Effect.gen(function* makePluginBootstrap() {
    const connectionAiSettingsService = yield* ConnectionAiSettingsService;
    const aiChatScopeService = yield* AIChatScopeService;
    const connectionAiScopeService = yield* ConnectionAiScopeService;

    return new PluginBootstrapImpl(connectionAiSettingsService, aiChatScopeService, connectionAiScopeService);
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ConnectionAiSettingsService>
    | Context.Service.Identifier<typeof AIChatScopeService>
    | Context.Service.Identifier<typeof ConnectionAiScopeService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
