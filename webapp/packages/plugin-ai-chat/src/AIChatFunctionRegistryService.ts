/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentType } from 'react';

import { injectable } from '@cloudbeaver/core-di';
import type { TranslateFn } from '@cloudbeaver/core-localization';
import type { AiFunction, AiFunctionCall } from '@cloudbeaver/core-sdk';
import { schema } from '@cloudbeaver/core-utils';

import { AIFunctionsResource } from './AIFunctionsResource.js';
import type { IAIFunctionConfirmationMessage } from './AIChat/AIChatMessage/AIChatMessagesResource.js';

export interface IAIChatFunctionContext {
  message: IAIFunctionConfirmationMessage;
  functionCall: AiFunctionCall;
}

export interface IAIChatFunctionInteractionProps<TArguments> extends IAIChatFunctionContext {
  arguments: TArguments;
}

export interface IAIChatFunctionAction<T> {
  id: string;
  aliases?: readonly string[];
  parametersSchema: schema.ZodType<T>;
  execute: (params: T) => void | Promise<void>;
  getLabel: (params: T, translate: TranslateFn) => string;
}

export interface IAIChatFunctionInteractionDefinition<TArguments, TResponse> {
  id: string;
  argumentsSchema: schema.ZodType<TArguments>;
  responseSchema: schema.ZodType<TResponse>;
  component: ComponentType<IAIChatFunctionContext>;
  respond: (context: IAIChatFunctionInteractionProps<TArguments>, response: TResponse) => Promise<void>;
}

interface IAIChatFunctionActionHandler {
  kind: 'action';
  id: string;
  execute: (params: unknown) => Promise<void>;
  getLabel: (params: unknown, translate: TranslateFn) => string | undefined;
}

interface IAIChatFunctionInteractionHandler {
  kind: 'interaction';
  id: string;
  component: ComponentType<IAIChatFunctionContext>;
  respond: (context: IAIChatFunctionContext, response: unknown) => Promise<void>;
}

type AIFunctionHandler = IAIChatFunctionActionHandler | IAIChatFunctionInteractionHandler;

@injectable(() => [AIFunctionsResource])
export class AIChatFunctionRegistryService {
  private readonly handlers = new Map<string, AIFunctionHandler>();

  constructor(private readonly aiFunctionsResource: AIFunctionsResource) {}

  registerAction<T>(definition: IAIChatFunctionAction<T>): void {
    this.addHandler(
      {
        kind: 'action',
        id: definition.id,
        execute: async params => {
          await definition.execute(definition.parametersSchema.parse(params));
        },
        getLabel: (params, translate) => {
          const result = definition.parametersSchema.safeParse(params);
          return result.success ? definition.getLabel(result.data, translate) : undefined;
        },
      },
      definition.aliases,
    );
  }

  registerInteraction<TArguments, TResponse>(definition: IAIChatFunctionInteractionDefinition<TArguments, TResponse>): void {
    const parseContext = (context: IAIChatFunctionContext): IAIChatFunctionInteractionProps<TArguments> => ({
      ...context,
      arguments: definition.argumentsSchema.parse(context.functionCall.arguments),
    });

    this.addHandler({
      kind: 'interaction',
      id: definition.id,
      component: definition.component,
      respond: async (context, response) => {
        await definition.respond(parseContext(context), definition.responseSchema.parse(response));
      },
    });
  }

  getFunction(id: string): AiFunction | undefined {
    const functionId = this.handlers.get(id)?.id ?? id;
    return this.aiFunctionsResource.data.find(func => func.id === functionId);
  }

  getActionLabel(id: string, params: unknown, translate: TranslateFn): string {
    const handler = this.handlers.get(id);
    return handler?.kind === 'action' ? (handler.getLabel(params, translate) ?? id) : id;
  }

  async executeFunction(id: string, params: unknown): Promise<void> {
    const action = this.handlers.get(id);

    if (action?.kind !== 'action') {
      throw new Error(`Function is not an executable action: ${id}`);
    }

    await action.execute(params);
  }

  isInteraction(id: string): boolean {
    return this.handlers.get(id)?.kind === 'interaction';
  }

  getInteraction(id: string): IAIChatFunctionInteractionHandler {
    const interaction = this.handlers.get(id);

    if (interaction?.kind !== 'interaction') {
      throw new Error(`Unknown interaction function: ${id}`);
    }

    return interaction;
  }

  async respondToFunction(context: IAIChatFunctionContext, response: unknown): Promise<void> {
    const interaction = this.handlers.get(context.functionCall.functionName);

    if (interaction?.kind !== 'interaction') {
      throw new Error(`Unknown interaction function: ${context.functionCall.functionName}`);
    }

    await interaction.respond(context, response);
  }

  private addHandler(handler: AIFunctionHandler, aliases: readonly string[] = []): void {
    const ids = [handler.id, ...aliases];

    if (new Set(ids).size !== ids.length || ids.some(id => this.handlers.has(id))) {
      throw new Error(`AI function is already registered: ${handler.id}`);
    }

    for (const id of ids) {
      this.handlers.set(id, handler);
    }
  }
}
