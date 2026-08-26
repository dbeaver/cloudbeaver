/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Menu, MenuProvider, MenuItem, MenuButton, MenuGroup, MenuGroupLabel } from '@dbeaver/ui-kit';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { ActionIconButton, ConfirmationDialogDelete, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';

import { AIChatConversationsService } from './AIChatConversation/AIChatConversationsService.js';
import {
  AIChatConversationsResource,
  ChatConversationConnectionKey,
  compareConversations,
  type AIChatConversationInfo,
} from './AIChatConversation/AIChatConversationsResource.js';
import { AIChatConversationType } from './AIChatConversation/AIChatConversationType.js';

interface Props {
  currentConnectionKey?: IConnectionInfoParams;
  disabled?: boolean;
}

enum EConversationGroup {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  OVER_WEEK_AGO = 'OVER_WEEK_AGO',
}

export const AIChatConversationsHistory = observer<Props>(function AIChatConversationsHistory({ currentConnectionKey, disabled }) {
  const translate = useTranslate();
  const aiChatConversationsService = useService(AIChatConversationsService);
  const commonDialogService = useService(CommonDialogService);

  const aiChatConversationsResource = useResource(
    AIChatConversationsHistory,
    AIChatConversationsResource,
    ChatConversationConnectionKey(currentConnectionKey),
  );

  const conversations = aiChatConversationsResource.data.filter(isNotNullDefined).sort(compareConversations);

  function selectConversation(conversationId: string): void {
    aiChatConversationsService.selectConversation(conversationId);
  }

  async function deleteConversation(conversation: AIChatConversationInfo) {
    const { status } = await commonDialogService.open(ConfirmationDialogDelete, {
      title: 'ui_data_delete_confirmation',
      message: translate('ui_delete_confirmation_message', undefined, { item: `"${conversation.caption}"` }),
      confirmActionText: 'ui_delete',
    });

    if (status === DialogueStateResult.Rejected) {
      return;
    }

    await aiChatConversationsService.deleteConversation(conversation.id);
  }

  const conversationGroups = Object.entries(groupByDate(conversations));

  return (
    <MenuProvider placement="bottom-end">
      <MenuButton
        render={
          <ActionIconButton
            title={translate('plugin_ai_chat_conversations_history')}
            disabled={!conversations.length || disabled}
            name="/icons/ai_history.svg"
            img
          />
        }
      />
      <Menu modal>
        {conversationGroups.map(([group, groupConversations]) => (
          <MenuGroup key={group}>
            <MenuGroupLabel>{translate(getGroupLabel(group as EConversationGroup))}</MenuGroupLabel>

            {groupConversations.map(conversation => {
              const isCurrent = conversation.id === aiChatConversationsService.currentConversationId;

              return (
                <MenuItem
                  key={conversation.id}
                  id={conversation.id}
                  title={conversation.caption}
                  className="tw:group tw:w-[300px]! tw:min-h-7 tw:shrink-0 tw:flex!"
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:overflow-hidden">
                      <AIChatConversationType conversation={conversation} />
                      <span className="tw:truncate">{conversation.caption}</span>
                    </div>

                    <div className="tw:flex tw:items-center tw:gap-1">
                      {isCurrent && (
                        <small className="tw:text-(--theme-text-hint-on-light)">{translate('plugin_ai_chat_current_conversation_hint')}</small>
                      )}
                      <ActionIconButton
                        className="tw:group-hover:flex tw:hidden"
                        name="trash"
                        viewBox="0 0 24 24"
                        onClick={async e => {
                          e.stopPropagation();
                          await deleteConversation(conversation);
                        }}
                      />
                    </div>
                  </div>
                </MenuItem>
              );
            })}
          </MenuGroup>
        ))}
      </Menu>
    </MenuProvider>
  );
});

function groupByDate(items: AIChatConversationInfo[]) {
  const result: Record<string, AIChatConversationInfo[]> = {};

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const item of items) {
    const itemDate = new Date(item.time);
    itemDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const group = getDateGroup(diffDays);

    if (!result[group]) {
      result[group] = [];
    }

    result[group].push(item);
  }

  return result;
}

function getDateGroup(diffDays: number): EConversationGroup {
  if (diffDays === 0) {
    return EConversationGroup.TODAY;
  }

  if (diffDays === 1) {
    return EConversationGroup.YESTERDAY;
  }

  if (diffDays <= 7) {
    return EConversationGroup.LAST_7_DAYS;
  }

  return EConversationGroup.OVER_WEEK_AGO;
}

function getGroupLabel(group: EConversationGroup): TLocalizationToken {
  switch (group) {
    case EConversationGroup.TODAY:
      return 'plugin_ai_chat_conversation_history_date_group_today';
    case EConversationGroup.YESTERDAY:
      return 'plugin_ai_chat_conversation_history_date_group_yesterday';
    case EConversationGroup.LAST_7_DAYS:
      return 'plugin_ai_chat_conversation_history_date_group_last_7_days';
    case EConversationGroup.OVER_WEEK_AGO:
      return 'plugin_ai_chat_conversation_history_date_group_over_week_ago';
    default:
      return 'plugin_ai_chat_conversation_history_date_group_over_week_ago';
  }
}
