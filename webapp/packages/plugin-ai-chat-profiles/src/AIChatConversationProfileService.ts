/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CachedMapAllKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { AIDefaultProfileService, AIProfilesResource, type AIProfile } from '@cloudbeaver/plugin-ai-profiles';

import {
  AIChatConversationsResource,
  AIChatConversationsService,
  conversationConfigContext,
  type AIChatConversationInfo,
} from '@cloudbeaver/plugin-ai-chat';

export class AIChatConversationProfileServiceImpl {
  constructor(
    aiChatConversationsService: AIChatConversationsService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
    private readonly aiDefaultProfileService: AIDefaultProfileService,
    private readonly aiProfilesResource: AIProfilesResource,
  ) {
    this.aiChatConversationsResource.sync(
      aiProfilesResource,
      () => CachedMapAllKey,
      key => {
        const profileIds = ResourceKeyUtils.toArray(aiProfilesResource.aliases.transformToKey(key));
        return resourceKeyList(
          this.aiChatConversationsResource.values
            .filter(conversation => conversation.profile && profileIds.includes(conversation.profile))
            .map(conversation => conversation.id),
        );
      },
    );

    aiChatConversationsService.onCreateConversation.addHandler(async ({ stage }, contexts) => {
      if (stage !== 'before') {
        return;
      }

      const config = contexts.getContext(conversationConfigContext);

      if (config.settings?.profile) {
        return;
      }

      const profile = await this.aiDefaultProfileService.restoreDefaultProfile();

      if (profile) {
        config.settings = { ...config.settings, profile: profile.id };
      }
    });

    aiChatConversationsService.onNewConversation.addHandler(async ({ stage, data }) => {
      if (stage !== 'after') {
        return;
      }

      const profile = await this.aiDefaultProfileService.restoreDefaultProfile();

      if (profile && data.profile !== profile.id) {
        await this.aiChatConversationsResource.updateConversation(data.id, { settings: { profile: profile.id } });
      }
    });
  }

  async restoreConversationProfile(conversationId: string): Promise<AIProfile | undefined> {
    const conversation = await this.aiChatConversationsResource.load(conversationId);
    const defaultProfile = await this.aiDefaultProfileService.restoreDefaultProfile();
    const profile = conversation.profile ? this.aiProfilesResource.get(conversation.profile) : undefined;

    if (profile) {
      return profile;
    }

    if (defaultProfile) {
      await this.aiChatConversationsResource.updateConversation(conversationId, { settings: { profile: defaultProfile.id } });
    }

    return defaultProfile;
  }

  async updateConversationProfile(conversationId: string, profileId: string): Promise<AIChatConversationInfo> {
    const conversation = await this.aiChatConversationsResource.updateConversation(conversationId, { settings: { profile: profileId } });
    await this.aiDefaultProfileService.setDefaultProfile(profileId);

    return conversation;
  }
}

export type AIChatConversationProfileService = AIChatConversationProfileServiceImpl;

export class AIChatConversationProfileServiceDI extends Context.Service<AIChatConversationProfileServiceDI, AIChatConversationProfileServiceImpl>()(
  '@cloudbeaver/plugin-ai-chat-profiles/AIChatConversationProfileService#AIChatConversationProfileService',
) {
  static readonly implementation = AIChatConversationProfileServiceImpl;

  static readonly dependencies = () =>
    [AIChatConversationsService, AIChatConversationsResource, AIDefaultProfileService, AIProfilesResource] as const;
  static readonly make: Effect.Effect<
    AIChatConversationProfileServiceImpl,
    never,
    | Context.Service.Identifier<typeof AIChatConversationsService>
    | Context.Service.Identifier<typeof AIChatConversationsResource>
    | Context.Service.Identifier<typeof AIDefaultProfileService>
    | Context.Service.Identifier<typeof AIProfilesResource>
  > = Effect.gen(function* makeAIChatConversationProfileService() {
    const aiChatConversationsService = yield* AIChatConversationsService;
    const aiChatConversationsResource = yield* AIChatConversationsResource;
    const aiDefaultProfileService = yield* AIDefaultProfileService;
    const aiProfilesResource = yield* AIProfilesResource;

    return new AIChatConversationProfileServiceImpl(
      aiChatConversationsService,
      aiChatConversationsResource,
      aiDefaultProfileService,
      aiProfilesResource,
    );
  });
  static readonly layer: Layer.Layer<
    AIChatConversationProfileServiceDI,
    never,
    | Context.Service.Identifier<typeof AIChatConversationsService>
    | Context.Service.Identifier<typeof AIChatConversationsResource>
    | Context.Service.Identifier<typeof AIDefaultProfileService>
    | Context.Service.Identifier<typeof AIProfilesResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatConversationProfileService = AIChatConversationProfileServiceDI;
