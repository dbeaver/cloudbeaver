/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { MenuGroup, MenuGroupLabel, MenuItemRadio } from '@dbeaver/ui-kit';
import { IconOrImage, RadioIndicator, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';

import type { AIChatProfile } from '../../../AIChatProfilesResource.js';
import type { AIChatConversationInfo } from '../AIChatConversationsResource.js';
import { AIChatConversationsService } from '../AIChatConversationsService.js';

interface Props {
  conversation: AIChatConversationInfo;
  profiles: AIChatProfile[];
  disabled?: boolean;
}

export const AIChatConversationProfile = observer<Props>(function AIChatConversationProfile({ conversation, profiles, disabled }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const aiChatConversationsService = useService(AIChatConversationsService);

  const aiEnginesResource = useResource(AIChatConversationProfile, AiEnginesResource, undefined);

  async function selectProfile(profileId: string) {
    try {
      await aiChatConversationsService.updateConversationProfile(conversation.id, profileId);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_profile_change_fail');
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
            value={profile.name}
            name={profile.id}
            aria-label={profile.name}
            title={profile.name}
            checked={isCurrent}
            disabled={disabled}
            className="tw:min-h-7"
            hideOnClick={false}
            onClick={() => selectProfile(profile.id)}
          >
            <div className="tw:flex tw:items-center tw:gap-2 tw:overflow-hidden">
              <RadioIndicator size="small" checked={isCurrent} />
              {engine?.icon && <IconOrImage className="tw:w-[14px]" icon={engine.icon} />}
              <span className="tw:truncate">{profile.name}</span>
            </div>
          </MenuItemRadio>
        );
      })}
    </MenuGroup>
  );
});
