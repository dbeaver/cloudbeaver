/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { createConnectionParam, isConnectionInfoParamEqual, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { isSQLEditorTab, SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import {
  ESqlDataSourceFeatures,
  LocalStorageSqlDataSource,
  SqlDataSourceService,
  SqlEditorPermissionService,
  SqlEditorService,
  type ILocalStorageSqlDataSourceState,
  type ISqlEditorTabState,
} from '@cloudbeaver/plugin-sql-editor';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService, type TLocalizationToken } from '@cloudbeaver/core-localization';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';

import { AIChatContextService } from '../AIChatContext/AIChatContextService.js';
import { AIChatConversationsResource } from '../AIChatConversation/AIChatConversationsResource.js';

const AI_CHAT_ID_METADATA_KEY = 'aiChatId';

@injectable(() => [
  SqlEditorService,
  NavigationTabsService,
  SqlEditorNavigatorService,
  AIChatContextService,
  AIChatConversationsResource,
  NotificationService,
  SqlDataSourceService,
  LocalizationService,
  CommonDialogService,
  SqlEditorPermissionService,
])
export class AIChatMessageActionsService {
  get isDisabled(): boolean {
    return !this.aiChatContextService.currentContext;
  }

  constructor(
    private readonly sqlEditorService: SqlEditorService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly aiChatContextService: AIChatContextService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
    private readonly notificationService: NotificationService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly localizationService: LocalizationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly sqlEditorPermissionService: SqlEditorPermissionService,
  ) {
    makeObservable(this, {
      isDisabled: computed,
    });
  }

  isAllowed(connectionKey: IConnectionInfoParams | null): boolean {
    if (!connectionKey) {
      return false;
    }

    return this.sqlEditorPermissionService.isScriptExecutionEnabled(connectionKey);
  }

  async executeQuery(conversationId: string | undefined | null, connectionKey: IConnectionInfoParams | null, query: string): Promise<void> {
    const currentTab = this.navigationTabsService.currentTab;

    const isOnlyResultsTab = this.isApplicableSqlEditorTab(connectionKey, conversationId, 'results');

    const tabs = [...this.navigationTabsService.findTabs<ISqlEditorTabState>(isOnlyResultsTab)];

    if (currentTab && isOnlyResultsTab(currentTab)) {
      tabs.unshift(currentTab);
    }

    if (tabs.length === 0) {
      const contextProvider = await this.sqlEditorNavigatorService.openNewEditor({
        connectionKey: connectionKey || undefined,
        dataSourceKey: LocalStorageSqlDataSource.key,
        query,
        name: this.getTabName('plugin_ai_chat_query_result_name', conversationId),
        dataSourceState: { showOnlyResults: true } as Partial<ILocalStorageSqlDataSourceState>,
        metadata: {
          [AI_CHAT_ID_METADATA_KEY]: conversationId,
        },
      });
      const tabContext = contextProvider.getContext(this.navigationTabsService.navigationTabContext);

      if (tabContext.tab) {
        tabs.push(tabContext.tab);
      }
    }

    const tab = tabs[0];

    if (!tab) {
      this.notificationService.logError({ title: 'plugin_ai_chat_execute_query_error' });
      return;
    }

    if (tab.id !== currentTab?.id) {
      this.navigationTabsService.selectTab(tab.id);
    }

    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
    const context = dataSource?.executionContext;

    if (!context) {
      throw new Error('Execution context is not provided');
    }

    const data = await this.sqlEditorService.parseSQLScript(context.projectId, context.connectionId, query);
    const queries = data.queries.map(q => query.substring(q.start, q.end));

    if (queries.length === 1) {
      await this.sqlEditorNavigatorService.executeEditorQuery(tab.id, queries[0]!);
      return;
    }

    await this.sqlEditorNavigatorService.executeQueries(tab.id, queries);
  }

  async insertInEditor(conversationId: string | undefined | null, connectionKey: IConnectionInfoParams | null, query: string): Promise<void> {
    const currentTab = this.navigationTabsService.currentTab;

    const isScriptTab = this.isApplicableSqlEditorTab(connectionKey, conversationId, 'editor');

    const tabs = [...this.navigationTabsService.findTabs<ISqlEditorTabState>(isScriptTab)];
    if (currentTab && isScriptTab(currentTab)) {
      tabs.unshift(currentTab);
    }
    const tab = tabs.find(tab => tab.handlerState.metadata?.[AI_CHAT_ID_METADATA_KEY] === conversationId) ?? tabs[0];

    if (tab) {
      if (tab.id !== currentTab?.id) {
        this.navigationTabsService.selectTab(tab.id);

        const { status } = await this.commonDialogService.open(ConfirmationDialog, {
          title: 'plugin_ai_chat_query_replace_confirmation_title',
          message: 'plugin_ai_chat_query_replace_confirmation_message',
          confirmActionText: 'ui_replace',
        });

        if (status === DialogueStateResult.Rejected) {
          return;
        }
      }

      // TODO: this will work only if executed when editor component already mounted, make sure that when switching tabs there is delay
      await this.sqlEditorService.updateActiveQuery.execute({
        editorId: tab.handlerState.editorId,
        update: {
          query,
          type: 'replace',
        },
      });
    } else {
      const contextProvider = await this.sqlEditorNavigatorService.openNewEditor({
        connectionKey: connectionKey || undefined,
        dataSourceKey: LocalStorageSqlDataSource.key,
        query,
        name: this.getTabName('plugin_ai_chat_editor_name', conversationId),
        metadata: {
          [AI_CHAT_ID_METADATA_KEY]: conversationId,
        },
      });
      const tabContext = contextProvider.getContext(this.navigationTabsService.navigationTabContext);

      if (!tabContext.tab) {
        this.notificationService.logError({ title: 'plugin_ai_chat_execute_query_error' });
      }
    }
  }

  private getTabName(prefix: TLocalizationToken, conversationId: string | undefined | null): string {
    let name = this.localizationService.translate(prefix);

    if (conversationId) {
      const conversation = this.aiChatConversationsResource.get(conversationId);

      if (conversation) {
        name += ` (${conversation.caption})`;
      }
    }
    return name;
  }

  private isApplicableSqlEditorTab(
    connectionKey: IConnectionInfoParams | null,
    conversationId: string | undefined | null,
    type: 'results' | 'editor',
  ) {
    return isSQLEditorTab(tab => {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

      let isConversationIdMatch = tab.handlerState.metadata?.[AI_CHAT_ID_METADATA_KEY] === conversationId;

      if (type === 'editor') {
        // allow to use usual sql editor without attachment to conversation
        isConversationIdMatch = isConversationIdMatch || !tab?.handlerState.metadata?.[AI_CHAT_ID_METADATA_KEY];
      }

      if (!isConversationIdMatch) {
        return false;
      }

      // Check if connection matches
      let isSameConnection = false;
      if (dataSource?.executionContext && connectionKey) {
        const param = createConnectionParam(dataSource.executionContext.projectId, dataSource.executionContext.connectionId);
        isSameConnection = isConnectionInfoParamEqual(param, connectionKey);
      } else {
        isSameConnection = dataSource?.executionContext === connectionKey;
      }

      if (!isSameConnection) {
        return false;
      }

      if (dataSource instanceof LocalStorageSqlDataSource) {
        return type === 'results' ? !dataSource.hasFeature(ESqlDataSourceFeatures.script) : dataSource.hasFeature(ESqlDataSourceFeatures.script);
      }

      // allow to use usual sql editor for editor only mode
      return type === 'results' ? false : true;
    });
  }
}
