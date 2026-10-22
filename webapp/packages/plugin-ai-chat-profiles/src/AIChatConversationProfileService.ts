/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { AIDefaultProfileService, AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { AIChatConversationsService, AIChatConversationsResource, type AIChatConversationInfo } from '@cloudbeaver/plugin-ai-chat';

@injectable(() => [AIChatConversationsService, AIChatConversationsResource, AIDefaultProfileService, AIProfilesResource])
export class AIChatConversationProfileService {
  saving = false;

  constructor(
    aiChatConversationsService: AIChatConversationsService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
    private readonly aiDefaultProfileService: AIDefaultProfileService,
    aiProfilesResource: AIProfilesResource,
  ) {
    makeObservable(this, { saving: observable });

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

    this.aiChatConversationsResource.onBeforeCreate.addHandler(async config => {
      const profile = await this.aiDefaultProfileService.restoreDefaultProfile();
      if (profile) {
        config.settings = { ...config.settings, profile: profile.id };
      }
    });

    aiChatConversationsService.onSelectConversation.addHandler(async conversation => {
      const profile = await this.aiDefaultProfileService.restoreDefaultProfile();
      if (profile && (!conversation.profile || !aiProfilesResource.has(conversation.profile))) {
        await this.aiChatConversationsResource.updateConversation(conversation.id, { settings: { profile: profile.id } });
      }
    });
  }

  async updateConversationProfile(conversationId: string, profileId: string): Promise<AIChatConversationInfo> {
    this.saving = true;
    try {
      const conversation = await this.aiChatConversationsResource.updateConversation(conversationId, { settings: { profile: profileId } });
      await this.aiDefaultProfileService.setDefaultProfile(profileId);
      return conversation;
    } finally {
      this.saving = false;
    }
  }
}
