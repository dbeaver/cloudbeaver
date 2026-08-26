/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, resourceKeyList, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import {
  AiFunctionType,
  AiMessageType,
  CbClientEventId,
  CbServerEventId,
  GraphQLService,
  type AiFunctionCall,
  type AiFunctionConfirmation,
  type AiFunctionResult,
  type AiMessage,
  type WsaiChatMessageErrorEvent,
  type WsaiFunctionCallConfirmationEvent,
} from '@cloudbeaver/core-sdk';

import { AIChatMessageEventHandler, type IAiChatMessageChunkEvent, type IAiChatMessageEvent } from './AIChatMessageEventHandler.js';
import { AIChatConversationsResource } from '../AIChatConversation/AIChatConversationsResource.js';
import { AIFunctionsResource } from '../../AIFunctionsResource.js';

export interface IAIFunctionMessage extends AiMessage {
  role: AiMessageType.Function;
  functionCall: AiFunctionCall;
  functionResult: AiFunctionResult;
}

export interface IAIFunctionConfirmationMessage extends AiMessage {
  role: AiMessageType.Confirmation;
  functionConfirmation?: AiFunctionConfirmation;
}

type AIMessage = AiMessage | IAIFunctionMessage | IAIFunctionConfirmationMessage;

export interface IMessageParam {
  id: string;
  conversationId: string;
}

interface IMessageStreamData {
  param: IMessageParam;
  state: 'start' | 'end';
}

const BLOCKING_ROLES = [AiMessageType.Assistant, AiMessageType.Confirmation];

@injectable(() => [
  GraphQLService,
  LocalizationService,
  AIChatMessageEventHandler,
  AIFunctionsResource,
  AIChatConversationsResource,
  UserInfoResource,
])
export class AIChatMessagesResource extends CachedMapResource<string, AiMessage[]> {
  onMessageStream: SyncExecutor<IMessageStreamData>;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly localizationService: LocalizationService,
    private readonly aiChatMessageEventHandler: AIChatMessageEventHandler,
    private readonly aiFunctionsResource: AIFunctionsResource,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
    userInfoResource: UserInfoResource,
  ) {
    super();

    this.onMessageStream = new SyncExecutor();

    userInfoResource.onUserChange.addHandler(() => {
      this.clear();
    });

    aiChatConversationsResource.onItemDelete.addHandler(this.delete.bind(this));
    aiChatConversationsResource.onDataOutdated.addHandler(this.markOutdated.bind(this));

    aiChatMessageEventHandler.onEvent<IAiChatMessageEvent>(
      CbServerEventId.CbAiChatMessage,
      data => {
        const param = createMessageParam(data.messageId, data.conversationId);
        const hasMessage = !!this.getMessage(param);
        const conversation = aiChatConversationsResource.get(data.conversationId);

        if (!hasMessage) {
          const message: AiMessage = {
            id: data.messageId,
            conversationId: data.conversationId,
            displayMessage: data.displayMessage,
            role: data.role as AiMessageType,
            content: data.content,
            time: data.time,
            functionCall: data.functionCall,
            functionResult: data.functionResult,
            functionConfirmation: data.functionConfirmation,
          };

          runInAction(() => {
            this.addMessages(data.conversationId, [message]);

            const shouldWait = BLOCKING_ROLES.includes(message.role) || message.functionResult?.type === AiFunctionType.Information;

            if (conversation) {
              conversation.waitingForResponse = shouldWait;
            }
          });

          if (isFunctionConfirmationMessage(message) && !this.isExternalFunction(param)) {
            this.processFunctionCall(param, true);
          }
        }
      },
      undefined,
      this,
    );

    aiChatMessageEventHandler.onEvent<IAiChatMessageChunkEvent>(
      CbServerEventId.CbAiChatMessageChunk,
      data => {
        const param = createMessageParam(data.messageId, data.conversationId);
        const prevMessage = this.getMessage(param);
        const conversation = aiChatConversationsResource.get(data.conversationId);

        runInAction(() => {
          if (data.chunk && prevMessage) {
            if (conversation?.waitingForResponse && prevMessage.content === '') {
              this.onMessageStream.execute({ state: 'start', param });
            }

            prevMessage.content += data.chunk;
          }

          if (data.completed) {
            this.onMessageStream.execute({ state: 'end', param });
          }
        });
      },
      undefined,
      this,
    );

    aiChatMessageEventHandler.onEvent<WsaiChatMessageErrorEvent>(
      CbServerEventId.CbAiChatMessageError,
      data => {
        const param = createMessageParam(data.messageId, data.conversationId);
        const prevMessage = this.getMessage(param);

        runInAction(() => {
          if (prevMessage) {
            prevMessage.role = AiMessageType.Error;
            prevMessage.content = data.errorMessage ?? this.localizationService.translate('plugin_ai_chat_generate_response_error');
          }

          this.onMessageStream.execute({ state: 'end', param });
        });
      },
      undefined,
      this,
    );

    this.onMessageStream.addHandler(data => {
      if (data.state === 'end') {
        const message = this.getMessage(data.param);
        const conversation = aiChatConversationsResource.get(data.param.conversationId);

        if (conversation?.waitingForResponse) {
          conversation.waitingForResponse = false;
        }

        if (!message) {
          this.markOutdated(data.param.conversationId);
        }
      }
    });
  }

  processFunctionCall(param: IMessageParam, confirmed: boolean) {
    const message = this.getMessage(param);

    if (!message || !isFunctionConfirmationMessage(message) || !message.functionConfirmation) {
      return;
    }

    const event: WsaiFunctionCallConfirmationEvent = {
      id: CbClientEventId.CbClientAiFunctionCallConfirmation,
      conversationId: param.conversationId,
      messageId: param.id,
    };

    const callIds = message.functionConfirmation.functionCalls.map(c => c.id);

    if (confirmed) {
      event.confirmedFunctionCalls = callIds;
    } else {
      event.declinedFunctionCalls = callIds;
    }

    this.aiChatMessageEventHandler.emit<WsaiFunctionCallConfirmationEvent>(event);

    runInAction(() => {
      if (!confirmed) {
        const conversation = this.aiChatConversationsResource.get(param.conversationId);

        if (conversation?.waitingForResponse) {
          conversation.waitingForResponse = false;
        }
      }
    });
  }

  isExternalFunction(param: IMessageParam) {
    const message = this.getMessage(param);

    if (!message || !isFunctionConfirmationMessage(message) || !message.functionConfirmation) {
      return false;
    }

    return message.functionConfirmation.functionCalls.some(call => {
      const func = this.aiFunctionsResource.data.find(f => f.id === call.functionName);
      return func?.system === false;
    });
  }

  async sendMessage(conversationId: string, prompt: string) {
    return await this.processSendMessage(conversationId, async () => {
      const { message } = await this.graphQLService.sdk.sendConversationMessage({ conversationId, prompt });
      return message;
    });
  }

  async processSendMessage<T>(conversationId: string, action: () => Promise<T>) {
    const useId = this.trackUse(conversationId);
    const message = await this.performUpdate(conversationId, undefined, action);

    if (useId) {
      setTimeout(() => this.freeUse(conversationId, useId), 5000);
    }

    return message;
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await this.performUpdate(conversationId, undefined, async () => {
      await this.graphQLService.sdk.deleteChatConversationMessage({ conversationId, messageId });
    });

    this.markOutdated(conversationId);
  }

  getMessage(param: IMessageParam) {
    const messages = this.data.get(param.conversationId) ?? [];
    const message = messages?.find(m => m.id === param.id);

    return message;
  }

  getMessageIndex(param: IMessageParam) {
    const messages = this.data.get(param.conversationId) ?? [];
    const messageIndex = messages?.findIndex(m => m.id === param.id);

    return messageIndex;
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, AiMessage[]>> {
    if (isResourceAlias(key)) {
      throw new Error('Aliases are not supported in this resource');
    }

    const messageList = new Map<string, AiMessage[]>();

    await ResourceKeyUtils.forEachAsync(key, async conversationId => {
      const { result } = await this.graphQLService.sdk.getChatConversationMessages({ conversationId });

      messageList.set(conversationId, result.messages);
    });

    this.set(resourceKeyList(Array.from(messageList.keys())), Array.from(messageList.values()));

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }

  private addMessages(conversationId: string, messages: AIMessage[]) {
    const prevMessages = this.data.get(conversationId) ?? [];
    const newMessages = [];

    for (const message of messages) {
      if (!prevMessages.some(m => m.id === message.id)) {
        newMessages.push(message);
      }
    }

    this.set(conversationId, [...prevMessages, ...newMessages]);
  }

  private trackUse(conversationId: string) {
    if (this.useTracker.isInUse(conversationId)) {
      return;
    }

    return this.useTracker.use(conversationId);
  }

  private freeUse(conversationId: string, useId: string) {
    if (this.useTracker.isInUse(conversationId)) {
      this.useTracker.free(conversationId, useId);
    }
  }
}

export function createMessageParam(id: string, conversationId: string): IMessageParam {
  return { id, conversationId };
}

export function isFunctionMessage(message: AIMessage): message is IAIFunctionMessage {
  return message.role === AiMessageType.Function;
}

export function isFunctionConfirmationMessage(message: AIMessage): message is IAIFunctionConfirmationMessage {
  return message.role === AiMessageType.Confirmation;
}
