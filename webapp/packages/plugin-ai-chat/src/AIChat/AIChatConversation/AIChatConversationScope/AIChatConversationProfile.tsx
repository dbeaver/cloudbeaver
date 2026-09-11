/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { MenuGroup, MenuGroupLabel, MenuItemRadio, useMenuContext } from '@dbeaver/ui-kit';
import { ActionIconButton, IconOrImage, RadioIndicator, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { AIProfileCredentialsService, type AIProfile } from '@cloudbeaver/plugin-ai-profiles';

import type { AIChatConversationInfo } from '../AIChatConversationsResource.js';
import { AIChatConversationsService } from '../AIChatConversationsService.js';

interface Props {
  conversation: AIChatConversationInfo;
  profiles: AIProfile[];
  disabled?: boolean;
}

export const AIChatConversationProfile = observer<Props>(function AIChatConversationProfile({ conversation, profiles, disabled }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const aiChatConversationsService = useService(AIChatConversationsService);
  const aiProfileCredentialsService = useService(AIProfileCredentialsService);
  const menu = useMenuContext();
  const aiEnginesResource = useResource(AIChatConversationProfile, AiEnginesResource, undefined);

  async function selectProfile(profile: AIProfile) {
    try {
      if (aiProfileCredentialsService.isRequired(profile)) {
        menu?.hide();
        const { status } = await aiProfileCredentialsService.open(profile.id);
        if (status !== DialogueStateResult.Resolved) {
          return;
        }
      }
      await aiChatConversationsService.updateConversationProfile(conversation.id, profile.id);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_profile_change_fail');
    }
  }

  async function editCredentials(profileId: string): Promise<void> {
    menu?.hide();

    try {
      await aiProfileCredentialsService.open(profileId);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_profile_credentials_edit_fail');
    }
  }

  if (profiles.length === 0) {
    return null;
  }

  return (
    <MenuGroup className="tw:flex tw:flex-col tw:gap-1">
      <MenuGroupLabel>{translate('plugin_ai_chat_profile_group')}</MenuGroupLabel>

      {profiles.map(profile => {
        const isCurrent = conversation.profile === profile.id;
        const engine = aiEnginesResource.data.find(e => e.id === profile.engineId);

        return (
          <MenuItemRadio
            key={profile.id}
            value={profile.id}
            name="ai-profile"
            aria-label={profile.name}
            title={profile.name}
            checked={isCurrent}
            disabled={disabled}
            className="tw:min-h-7"
            hideOnClick={false}
            onClick={() => selectProfile(profile)}
          >
            <div className="tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2">
              <div className="tw:flex tw:items-center tw:gap-2 tw:overflow-hidden">
                <RadioIndicator size="small" checked={isCurrent} />
                {engine?.icon && <IconOrImage width={16} icon={engine.icon} />}
                <span className="tw:truncate">{profile.name}</span>
              </div>
              {profile.global ? (
                <div className="tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center">
                  <IconOrImage width={16} icon="document-global" />
                </div>
              ) : (
                <ActionIconButton
                  aria-label={translate('plugin_ai_chat_profile_edit_credentials')}
                  title={translate('plugin_ai_chat_profile_edit_credentials')}
                  disabled={disabled}
                  name="edit"
                  viewBox="0 0 13 13"
                  onClick={() => editCredentials(profile.id)}
                />
              )}
            </div>
          </MenuItemRadio>
        );
      })}
    </MenuGroup>
  );
});
