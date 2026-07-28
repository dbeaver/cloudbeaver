/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { schema } from '@cloudbeaver/core-utils';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { LocalStorageSqlDataSource } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { AIFunctionsResource } from './AIFunctionsResource.js';
import { AIChatContextService } from './AIChat/AIChatContext/AIChatContextService.js';
import { AIChatConversationsService } from './AIChat/AIChatConversation/AIChatConversationsService.js';
import { AIChatConversationsResource } from './AIChat/AIChatConversation/AIChatConversationsResource.js';

const FUNCTION_DB_OPEN_ENTITY_EDITOR_SCHEMA = schema.object({
  objectName: schema.string(),
  objectName_nodePath: schema.string(),
});

const FUNCTION_DB_OPEN_SQL_EDITOR_SCHEMA = schema.object({
  sqlText: schema.string().optional(),
});

const FUNCTION_SCHEMAS = {
  db_openTableDataEditor: FUNCTION_DB_OPEN_ENTITY_EDITOR_SCHEMA,
  db_openSQLEditor: FUNCTION_DB_OPEN_SQL_EDITOR_SCHEMA,
};

export type AIFunctionName = keyof typeof FUNCTION_SCHEMAS;
export type AIParamsFor<T extends AIFunctionName> = schema.infer<(typeof FUNCTION_SCHEMAS)[T]>;

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
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly aiFunctionsResource: AIFunctionsResource,
    private readonly aiChatContextService: AIChatContextService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly localizationService: LocalizationService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
  ) {}

  getFunction(id: string) {
    return this.aiFunctionsResource.data.find(func => func.id === id);
  }

  async executeFunction<T extends AIFunctionName>(functionName: T, params: AIParamsFor<T>): Promise<void> {
    if (!isAIFunctionName(functionName)) {
      throw new Error(`Unknown function: ${functionName}`);
    }

    if (!isAIFunctionParams(functionName, params)) {
      throw new Error(`Missing required parameters for function ${functionName}`);
    }

    await this.handlers[functionName](params);
  }

  private handlers: { [K in AIFunctionName]: (params: AIParamsFor<K>) => void | Promise<void> } = {
    db_openTableDataEditor: params => this.openEntity(params),
    db_openSQLEditor: params => this.openEditor(params),
  };

  private async openEntity(params: AIParamsFor<'db_openTableDataEditor'>) {
    await this.navNodeManagerService.navToNode(params.objectName_nodePath);
  }

  private async openEditor(params: AIParamsFor<'db_openSQLEditor'>) {
    const context = this.aiChatContextService.currentContext;
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
      query: params.sqlText,
      name,
    });
  }
}

export function isAIFunctionName(fn: string): fn is AIFunctionName {
  return fn in FUNCTION_SCHEMAS;
}

export function isAIFunctionParams<T extends AIFunctionName>(fn: T, params: unknown): params is AIParamsFor<T> {
  return FUNCTION_SCHEMAS[fn].safeParse(params).success;
}

export function parseAIFunction(fn: string, params: unknown): { [K in AIFunctionName]: { fn: K; params: AIParamsFor<K> } }[AIFunctionName] | null {
  if (!isAIFunctionName(fn)) {
    return null;
  }

  const result = FUNCTION_SCHEMAS[fn].safeParse(params);

  if (!result.success) {
    return null;
  }

  return { fn, params: result.data } as { [K in AIFunctionName]: { fn: K; params: AIParamsFor<K> } }[AIFunctionName];
}
