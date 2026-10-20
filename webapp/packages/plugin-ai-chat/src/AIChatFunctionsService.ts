/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentType } from 'react';

import { injectable } from '@cloudbeaver/core-di';
import { LocalizationService, type TranslateFn } from '@cloudbeaver/core-localization';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import type { AiFunction, AiFunctionCall } from '@cloudbeaver/core-sdk';
import { schema } from '@cloudbeaver/core-utils';
import { LocalStorageSqlDataSource } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { AIFunctionsResource } from './AIFunctionsResource.js';
import type { IAIFunctionConfirmationMessage } from './AIChat/AIChatMessage/AIChatMessagesResource.js';
import { AIChatContextService } from './AIChat/AIChatContext/AIChatContextService.js';
import { AIChatConversationsService } from './AIChat/AIChatConversation/AIChatConversationsService.js';
import { AIChatConversationsResource } from './AIChat/AIChatConversation/AIChatConversationsResource.js';

const FUNCTION_DB_OPEN_ENTITY_EDITOR_SCHEMA = schema.object({
  objectName: schema.string(),
  objectName_nodePath: schema.string(),
});

const FUNCTION_DB_OPEN_SQL_EDITOR_SCHEMA = schema.object({
  sqlText: schema.string().optional(),
  newEditor: schema.boolean().optional(),
});

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

export function getCanonicalAIFunctionId(id: string): string {
  if (id === 'db_openTableDataEditor') {
    return 'db_uiOpenDBeaverEntityEditor';
  }
  if (id === 'db_openSQLEditor') {
    return 'db_uiOpenDBeaverSQLEditor';
  }
  return id;
}

@injectable(() => [
  NavNodeManagerService,
  AIFunctionsResource,
  AIChatContextService,
  SqlEditorNavigatorService,
  AIChatConversationsService,
  LocalizationService,
  AIChatConversationsResource,
])
export class AIChatFunctionsService {
  private readonly handlers = new Map<string, AIFunctionHandler>();

  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly aiFunctionsResource: AIFunctionsResource,
    private readonly aiChatContextService: AIChatContextService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly localizationService: LocalizationService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
  ) {}

  register(): void {
    this.registerAction({
      id: 'db_uiOpenDBeaverEntityEditor',
      aliases: ['db_openTableDataEditor'],
      parametersSchema: FUNCTION_DB_OPEN_ENTITY_EDITOR_SCHEMA,
      execute: params => this.openEntity(params),
      getLabel: (params, translate) => `${translate('ui_open')} "${params.objectName}"`,
    });

    this.registerAction({
      id: 'db_uiOpenDBeaverSQLEditor',
      aliases: ['db_openSQLEditor'],
      parametersSchema: FUNCTION_DB_OPEN_SQL_EDITOR_SCHEMA,
      execute: params => this.openEditor(params),
      getLabel: (params, translate) => `${translate('ui_open')} ${translate('sql_editor_script_editor')}`,
    });
  }

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
    const functionId = this.handlers.get(id)?.id ?? getCanonicalAIFunctionId(id);
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

  private async openEntity(params: schema.infer<typeof FUNCTION_DB_OPEN_ENTITY_EDITOR_SCHEMA>) {
    await this.navNodeManagerService.navToNode(params.objectName_nodePath);
  }

  private async openEditor(params: schema.infer<typeof FUNCTION_DB_OPEN_SQL_EDITOR_SCHEMA>) {
    const context = this.aiChatContextService.currentContext;
    if (params.newEditor === false && this.sqlEditorNavigatorService.openRecentEditor(context?.connectionKey || undefined)) {
      return;
    }

    const conversationId = this.aiChatConversationsService.currentConversationId;

    let name = this.localizationService.translate('plugin_ai_chat_editor_name');

    if (conversationId) {
      const conversation = this.aiChatConversationsResource.get(conversationId);

      if (conversation) {
        name += ` (${conversation.caption})`;
      }
    }

    await this.sqlEditorNavigatorService.openNewEditor({
      connectionKey: context?.connectionKey || undefined,
      dataSourceKey: LocalStorageSqlDataSource.key,
      query: params.newEditor === false ? undefined : params.sqlText,
      name,
    });
  }
}
