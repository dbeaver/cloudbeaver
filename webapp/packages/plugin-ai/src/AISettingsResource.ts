/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { ServerConfigResource, ServerEventId, WorkspaceConfigEventHandler } from '@cloudbeaver/core-root';
import { type AiSettingsConfig, type AiSettingsInfo, GraphQLService } from '@cloudbeaver/core-sdk';

export type AISettings = AiSettingsInfo;

export class AISettingsResourceImpl extends CachedDataResource<AISettings | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
    workspaceConfigEventHandler: WorkspaceConfigEventHandler,
  ) {
    super(() => null);

    this.sync(serverConfigResource);
    workspaceConfigEventHandler.onEvent(ServerEventId.CbWorkspaceConfigChanged, () => this.markOutdated(), undefined, this);
  }

  async saveSettings(settings: AiSettingsConfig): Promise<void> {
    await this.performUpdate(undefined, undefined, async () => {
      const { result } = await this.graphQLService.sdk.saveAiSettings({ settings });
      this.setData(result);
    });
  }

  protected async loader(): Promise<AISettings> {
    const { settings } = await this.graphQLService.sdk.getAiSettings();
    return settings;
  }
}

export type AISettingsResource = AISettingsResourceImpl;

export class AISettingsResourceDI extends Context.Service<AISettingsResourceDI, AISettingsResourceImpl>()(
  '@cloudbeaver/plugin-ai/AISettingsResource#AISettingsResource',
) {
  static readonly implementation = AISettingsResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource, WorkspaceConfigEventHandler] as const;
  static readonly make: Effect.Effect<
    AISettingsResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof WorkspaceConfigEventHandler>
  > = Effect.gen(function* makeAISettingsResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;
    const workspaceConfigEventHandler = yield* WorkspaceConfigEventHandler;

    return new AISettingsResourceImpl(graphQLService, serverConfigResource, workspaceConfigEventHandler);
  });
  static readonly layer: Layer.Layer<
    AISettingsResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof WorkspaceConfigEventHandler>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AISettingsResource = AISettingsResourceDI;
