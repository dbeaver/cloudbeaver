/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { ActionIconButton, Fill, RenameDialog, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';

import { AIChatContextManager } from './AIChatContext/AIChatContextManager.js';
import { AIChatConversationsResource, type AIChatConversationInfo } from './AIChatConversation/AIChatConversationsResource.js';
import { AIChatConversationsService } from './AIChatConversation/AIChatConversationsService.js';
import { AIChatConversationsHistory } from './AIChatConversationsHistory.js';
import { AIChatContext } from './AIChatContext.js';
import { AIChatConversationScope } from './AIChatConversation/AIChatConversationScope/AIChatConversationScope.js';
import { AIChatConversationType } from './AIChatConversation/AIChatConversationType.js';
import { AISettings } from './AISettings.js';
import classes from './AIChatHeader.module.css';
import { EAIConversationPromptGeneratorId } from '../EAIConversationPromptGeneratorId.js';

interface Props {
  currentConversationId: string | null;
}

export const AIChatHeader = observer<Props>(function AIChatHeader({ currentConversationId }) {
  const styles = useS(classes);
  const translate = useTranslate();
  const context = useContext(AIChatContext);
  const aiChatConversationsService = useService(AIChatConversationsService);
  const commonDialogService = useService(CommonDialogService);

  const aiChatConversationResource = useResource(AIChatHeader, AIChatConversationsResource, currentConversationId);
  const currentConversation = aiChatConversationResource.data;

  const connectionInfoResource = useResource(AIChatHeader, ConnectionInfoResource, currentConversation?.dataSourceId ?? null);

  async function createConversation() {
    await aiChatConversationsService.createConversation(context.connectionKey ?? null);
  }

  async function updateCaption(conversation: AIChatConversationInfo) {
    const { status, result: caption } = await commonDialogService.open(RenameDialog, { name: conversation.caption });

    if (status === DialogueStateResult.Resolved && caption !== undefined) {
      await aiChatConversationsService.updateConversation(conversation.id, { caption });
    }
  }

  const disabled = context.disabled;
  const isScope =
    currentConversation &&
    currentConversation.promptGeneratorId !== EAIConversationPromptGeneratorId.OBJECT_DESCRIBE &&
    connectionInfoResource.data?.connected;

  return (
    <div className={s(styles, { container: true })}>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <AIChatContextManager disabled={disabled} />

        <div className="tw:flex tw:items-center">
          {isScope && (
            <AIChatConversationScope conversation={currentConversation} catalog={context.catalog} schema={context.schema} disabled={disabled} />
          )}
          <AISettings />
        </div>
      </div>

      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        {currentConversation && (
          <div className={s(styles, { title: true })} title={currentConversation.caption} onClick={() => updateCaption(currentConversation)}>
            <AIChatConversationType conversation={currentConversation} />
            <span className="tw:truncate">{currentConversation.caption}</span>
          </div>
        )}
        <Fill />
        <div className="tw:flex tw:items-center">
          <ActionIconButton
            name="/icons/add_chat.svg"
            title={translate('plugin_ai_chat_conversation_new')}
            disabled={disabled}
            img
            onClick={createConversation}
          />
          <AIChatConversationsHistory currentConnectionKey={context.connectionKey} disabled={disabled} />
        </div>
      </div>
    </div>
  );
});
