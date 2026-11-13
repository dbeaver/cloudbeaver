/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ClipboardEvent, DragEvent, RefObject } from 'react';
import { makeObservable, observable, runInAction } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ExecutionContext, ExecutorInterrupter, SyncExecutor } from '@cloudbeaver/core-executor';
import type { AiSendChatMessageInfoFragment } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { AIChatConversationsService } from '../AIChatConversation/AIChatConversationsService.js';
import { AIChatMessageService } from '../AIChatMessage/AIChatMessageService.js';
import { AIChatConversationsResource } from '../AIChatConversation/AIChatConversationsResource.js';
import { AIChatInputState } from './AIChatInputState.js';

export interface IAIChatInputContext {
  readonly conversationId: string | null;
  readonly connectionKey?: IConnectionInfoParams;
  readonly textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export interface IAIChatInputProps {
  input: IAIChatInputContext;
}

export interface IAIChatInputDragEvent extends IAIChatInputProps {
  event: DragEvent<HTMLElement>;
}

export interface IAIChatInputPasteEvent extends IAIChatInputProps {
  event: ClipboardEvent<HTMLTextAreaElement>;
}

export interface IAIChatInputValidation extends IAIChatInputProps {
  prompt: string;
  hasContent: boolean;
  valid: boolean;
}

export interface IAIChatInputSubmission extends IAIChatInputProps {
  prompt: string;
}

export class AIChatInputServiceImpl {
  readonly onDrag = new SyncExecutor<IAIChatInputDragEvent>();
  readonly onPaste = new SyncExecutor<IAIChatInputPasteEvent>();
  readonly onValidate = new SyncExecutor<IAIChatInputValidation>();
  readonly onPrepareSubmit = new SyncExecutor<IAIChatInputSubmission>();

  readonly beforeInput = new PlaceholderContainer<IAIChatInputProps>();
  readonly dragPreview = new PlaceholderContainer<IAIChatInputProps>();

  private readonly states = new Map<string, AIChatInputState>();

  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly aiChatMessageService: AIChatMessageService,
    userInfoResource: UserInfoResource,
    aiChatConversationsResource: AIChatConversationsResource,
  ) {
    makeObservable<this, 'states'>(this, {
      states: observable.shallow,
    });

    userInfoResource.onUserChange.addHandler(() => {
      this.states.clear();
    });

    aiChatConversationsResource.onItemDelete.addHandler(conversationId => {
      runInAction(() => {
        for (const [key, state] of this.states) {
          if (state.conversationId === conversationId) {
            this.states.delete(key);
          }
        }
      });
    });

    this.aiChatConversationsService.onCreateConversation.addHandler(({ stage, data }) => {
      if (stage !== 'after') {
        return;
      }

      const input = { conversationId: null, connectionKey: data.dataSourceId ?? undefined };
      const key = this.getStateKey(input);
      const state = this.states.get(key);

      if (!state || state.conversationId !== null) {
        return;
      }

      runInAction(() => {
        state.conversationId = data.id;
        this.states.set(this.getStateKey(input, data.id), state);
        this.states.delete(key);
      });
    });
  }

  getState(input: IAIChatInputContext): AIChatInputState {
    const key = this.getStateKey(input);
    let state = this.states.get(key);

    if (!state) {
      state = new AIChatInputState(input.conversationId);
      this.states.set(key, state);
    }

    return state;
  }

  canSubmit(input: IAIChatInputContext, prompt: string): boolean {
    const data: IAIChatInputValidation = { input, prompt, hasContent: prompt.trim().length > 0, valid: true };
    this.onValidate.execute(data);

    return data.hasContent && data.valid;
  }

  async submit(input: IAIChatInputContext, prompt: string): Promise<AiSendChatMessageInfoFragment | undefined> {
    if (!this.canSubmit(input, prompt) || this.aiChatConversationsService.processing) {
      return;
    }

    const data: IAIChatInputSubmission = { input, prompt: prompt.trim() };
    const context = new ExecutionContext(data);
    this.onPrepareSubmit.execute(data, context);

    if (ExecutorInterrupter.isInterrupted(context)) {
      return;
    }

    let conversationId = input.conversationId;

    if (!isNotNullDefined(conversationId)) {
      const conversation = await this.aiChatConversationsService.createConversation(input.connectionKey ?? null);
      conversationId = conversation.id;
    }

    return await this.aiChatMessageService.sendMessage(conversationId, data.prompt, context);
  }

  private getStateKey(input: Pick<IAIChatInputContext, 'conversationId' | 'connectionKey'>, conversationId = input.conversationId): string {
    return JSON.stringify([conversationId, input.connectionKey?.projectId, input.connectionKey?.connectionId]);
  }
}

export type AIChatInputService = AIChatInputServiceImpl;

export class AIChatInputServiceDI extends Context.Service<AIChatInputServiceDI, AIChatInputServiceImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIChat/AIChatInput/AIChatInputService#AIChatInputService',
) {
  static readonly implementation = AIChatInputServiceImpl;
  static readonly dependencies = () => [AIChatConversationsService, AIChatMessageService, UserInfoResource, AIChatConversationsResource] as const;
  static readonly make: Effect.Effect<
    AIChatInputServiceImpl,
    never,
    | Context.Service.Identifier<typeof AIChatConversationsService>
    | Context.Service.Identifier<typeof AIChatMessageService>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof AIChatConversationsResource>
  > = Effect.gen(function* makeAIChatInputService() {
    const aiChatConversationsService = yield* AIChatConversationsService;
    const aiChatMessageService = yield* AIChatMessageService;
    const userInfoResource = yield* UserInfoResource;
    const aiChatConversationsResource = yield* AIChatConversationsResource;
    return new AIChatInputServiceImpl(aiChatConversationsService, aiChatMessageService, userInfoResource, aiChatConversationsResource);
  });
  static readonly layer: Layer.Layer<
    AIChatInputServiceDI,
    never,
    | Context.Service.Identifier<typeof AIChatConversationsService>
    | Context.Service.Identifier<typeof AIChatMessageService>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof AIChatConversationsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatInputService = AIChatInputServiceDI;
