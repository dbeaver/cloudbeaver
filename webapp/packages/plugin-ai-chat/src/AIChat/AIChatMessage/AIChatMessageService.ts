/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { DialogueStateResult, CommonDialogService } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { ConnectionsManagerService, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { AiSendChatMessageInfoFragment } from '@cloudbeaver/core-sdk';

import { AIChatMessagesResource, isFunctionConfirmationMessage, isFunctionMessage, type IMessageParam } from './AIChatMessagesResource.js';
import { AIChatConversationsResource } from '../AIChatConversation/AIChatConversationsResource.js';

type IAiSendChatMessageInfo = AiSendChatMessageInfoFragment;

export enum EAiFunctionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

interface IAiSendChatMessageBeforeInfo {
  conversationId: string;
  connectionKey?: IConnectionInfoParams;
}

interface IMessageSendExecutorBeforeData {
  stage: 'before';
  data: IAiSendChatMessageBeforeInfo;
}

interface IMessageSendExecutorAfterData {
  stage: 'after';
  data: IAiSendChatMessageInfo;
}

type MessageSendExecutorData = IMessageSendExecutorBeforeData | IMessageSendExecutorAfterData;

@injectable(() => [AIChatMessagesResource, AIChatConversationsResource, CommonDialogService, LocalizationService, ConnectionsManagerService])
export class AIChatMessageService {
  onMessageSend: Executor<MessageSendExecutorData>;

  constructor(
    private readonly aiChatMessagesResource: AIChatMessagesResource,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly localizationService: LocalizationService,
    private readonly connectionsManagerService: ConnectionsManagerService,
  ) {
    this.onMessageSend = new Executor();

    this.onMessageSend.addHandler(({ stage, data }) => {
      if (stage === 'after') {
        const conversation = this.aiChatConversationsResource.get(data.conversation.id);

        if (conversation) {
          runInAction(() => {
            if (conversation.caption !== data.conversation.caption) {
              conversation.caption = data.conversation.caption;
            }

            conversation.time = data.conversation.time;
            conversation.waitingForResponse = data.conversation.waitingForResponse;
          });
        }
      }
    });
  }

  async sendMessage(conversationId: string, prompt: string) {
    return await this.processSendMessageAction(conversationId, async () => await this.aiChatMessagesResource.sendMessage(conversationId, prompt));
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await this.aiChatMessagesResource.deleteMessage(conversationId, messageId);
  }

  /** @TODO change to the api status */
  getFunctionStatus(param: IMessageParam): EAiFunctionStatus | null {
    const index = this.aiChatMessagesResource.getMessageIndex(param);
    const messages = this.aiChatMessagesResource.get(param.conversationId);
    const message = messages?.[index];
    const conversation = this.aiChatConversationsResource.get(param.conversationId);

    if (!message || !isFunctionConfirmationMessage(message)) {
      return null;
    }

    const nextMessage = messages?.[index + 1];

    if (!nextMessage && conversation?.waitingForResponse) {
      return EAiFunctionStatus.PENDING;
    }

    if (nextMessage && isFunctionMessage(nextMessage)) {
      return EAiFunctionStatus.CONFIRMED;
    }

    return EAiFunctionStatus.REJECTED;
  }

  isFunctionConfirmationRequired(param: IMessageParam): boolean {
    const status = this.getFunctionStatus(param);
    return this.aiChatMessagesResource.isExternalFunction(param) && status === EAiFunctionStatus.PENDING;
  }

  async processSendMessageAction(conversationId: string, action: () => Promise<IAiSendChatMessageInfo>) {
    const conversation = await this.aiChatConversationsResource.load(conversationId);
    const contexts = await this.onMessageSend.execute({ stage: 'before', data: { conversationId, connectionKey: conversation.dataSourceId } });

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    if (conversation.dataSourceId) {
      const connection = await this.connectionsManagerService.requireConnection(conversation.dataSourceId);

      if (!connection) {
        return;
      }

      if (conversation.settings?.metaTransferConfirmed === false) {
        const { status } = await this.commonDialogService.open(ConfirmationDialog, {
          title: 'plugin_ai_chat_metadata_transfer_confirmation_title',
          message: 'plugin_ai_chat_metadata_transfer_confirmation_message',
          confirmActionText: 'plugin_ai_chat_metadata_transfer_confirmation',
          size: 'medium',
        });

        if (status === DialogueStateResult.Rejected) {
          return;
        }

        const updated = await this.aiChatConversationsResource.updateConversation(conversation.id, {
          settings: {
            metaTransferConfirmed: true,
          },
        });

        if (updated.settings?.metaTransferConfirmed === false) {
          throw new Error(this.localizationService.translate('plugin_ai_chat_metadata_transfer_rejection'));
        }
      }
    }

    const message = await action();

    await this.onMessageSend.execute({ stage: 'after', data: message });

    return message;
  }
}
