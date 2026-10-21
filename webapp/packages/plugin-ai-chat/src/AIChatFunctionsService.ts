/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { schema } from '@cloudbeaver/core-utils';
import { LocalStorageSqlDataSource } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { AIChatFunctionRegistryService } from './AIChatFunctionRegistryService.js';
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

@injectable(() => [
  NavNodeManagerService,
  AIChatFunctionRegistryService,
  AIChatContextService,
  SqlEditorNavigatorService,
  AIChatConversationsService,
  LocalizationService,
  AIChatConversationsResource,
])
export class AIChatFunctionsService {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly aiChatFunctionRegistryService: AIChatFunctionRegistryService,
    private readonly aiChatContextService: AIChatContextService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly localizationService: LocalizationService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
  ) {}

  register(): void {
    this.aiChatFunctionRegistryService.registerAction({
      id: 'db_uiOpenDBeaverEntityEditor',
      aliases: ['db_openTableDataEditor'],
      parametersSchema: FUNCTION_DB_OPEN_ENTITY_EDITOR_SCHEMA,
      execute: params => this.openEntity(params),
      getLabel: (params, translate) => `${translate('ui_open')} "${params.objectName}"`,
    });

    this.aiChatFunctionRegistryService.registerAction({
      id: 'db_uiOpenDBeaverSQLEditor',
      aliases: ['db_openSQLEditor'],
      parametersSchema: FUNCTION_DB_OPEN_SQL_EDITOR_SCHEMA,
      execute: params => this.openEditor(params),
      getLabel: (params, translate) => `${translate('ui_open')} ${translate('sql_editor_script_editor')}`,
    });
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
