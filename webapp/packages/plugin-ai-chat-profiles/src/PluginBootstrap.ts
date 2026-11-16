/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { Executor, ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { AIChatConversationsService, AIChatMessageService, type MessageSendExecutorData } from '@cloudbeaver/plugin-ai-chat';
import { AIProfileCredentialsService, AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { AIChatConversationProfileService } from './AIChatConversationProfileService.js';

const AIChatConversationProfile = importLazyComponent(() => import('./AIChatConversationProfile.js').then(m => m.AIChatConversationProfile));

export class PluginBootstrapImpl extends Bootstrap {
  private readonly checkCredentials = new Executor<MessageSendExecutorData>();

  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly aiChatConversationProfileService: AIChatConversationProfileService,
    private readonly aiChatMessageService: AIChatMessageService,
    private readonly aiProfileCredentialsService: AIProfileCredentialsService,
    private readonly aiProfilesResource: AIProfilesResource,
  ) {
    super();
  }

  override register(): void {
    this.aiChatConversationsService.menuSections.add(
      AIChatConversationProfile,
      1,
      () => this.aiProfilesResource.values.length === 0,
      () => [getCachedMapResourceLoaderState(this.aiProfilesResource, () => CachedMapAllKey)],
    );

    this.checkCredentials.addHandler(this.restoreProfileAndCheckCredentials.bind(this));
    this.aiChatMessageService.onMessageSend.before(this.checkCredentials);
  }

  private async restoreProfileAndCheckCredentials(
    { stage, data }: MessageSendExecutorData,
    contexts: IExecutionContextProvider<MessageSendExecutorData>,
  ): Promise<void> {
    if (stage !== 'before') {
      return;
    }

    const profile = await this.aiChatConversationProfileService.restoreConversationProfile(data.conversationId);

    if (profile && this.aiProfileCredentialsService.isRequired(profile)) {
      const result = await this.aiProfileCredentialsService.open(profile.id);

      if (result?.status !== DialogueStateResult.Resolved) {
        ExecutorInterrupter.interrupt(contexts);
      }
    }
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-ai-chat-profiles/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () =>
    [AIChatConversationsService, AIChatConversationProfileService, AIChatMessageService, AIProfileCredentialsService, AIProfilesResource] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof AIChatConversationsService>
    | Context.Service.Identifier<typeof AIChatConversationProfileService>
    | Context.Service.Identifier<typeof AIChatMessageService>
    | Context.Service.Identifier<typeof AIProfileCredentialsService>
    | Context.Service.Identifier<typeof AIProfilesResource>
  > = Effect.gen(function* makePluginBootstrap() {
    const aiChatConversationsService = yield* AIChatConversationsService;
    const aiChatConversationProfileService = yield* AIChatConversationProfileService;
    const aiChatMessageService = yield* AIChatMessageService;
    const aiProfileCredentialsService = yield* AIProfileCredentialsService;
    const aiProfilesResource = yield* AIProfilesResource;

    return new PluginBootstrapImpl(
      aiChatConversationsService,
      aiChatConversationProfileService,
      aiChatMessageService,
      aiProfileCredentialsService,
      aiProfilesResource,
    );
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof AIChatConversationsService>
    | Context.Service.Identifier<typeof AIChatConversationProfileService>
    | Context.Service.Identifier<typeof AIChatMessageService>
    | Context.Service.Identifier<typeof AIProfileCredentialsService>
    | Context.Service.Identifier<typeof AIProfilesResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
