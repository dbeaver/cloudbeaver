/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';

import { Menu, MenuProvider, MenuButton, MenuItemRadio, MenuGroup, MenuGroupLabel } from '@dbeaver/ui-kit';
import { ActionIconButton, Placeholder, RadioIndicator, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ConnectionsManagerService, ContainerResource } from '@cloudbeaver/core-connections';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { NotificationService } from '@cloudbeaver/core-events';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';

import { AIChatConversationsService, AIChatContext, type AIChatActionsProps } from '@cloudbeaver/plugin-ai-chat';

import { AIChatConversationScopeResource } from './AIChatConversationScopeResource.js';
import { ConnectionInfoAiResource } from '../../ConnectionInfoAiResource.js';
import { AiScopeDialog } from '../AiScopeDialogLazy.js';

interface IScopeItem {
  id: AiDatabaseScope;
  label: string;
}

export const AIChatConversationScope = observer<AIChatActionsProps>(function AIChatConversationScope({ conversation }) {
  const context = useContext(AIChatContext);
  const { catalog, schema, disabled } = context;
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const connectionInfoAiResource = useService(ConnectionInfoAiResource);
  const commonDialogService = useService(CommonDialogService);
  const aiChatConversationsService = useService(AIChatConversationsService);
  const aiChatConversationScopeResource = useService(AIChatConversationScopeResource);

  const { data: container } = useResource(AIChatConversationScope, ContainerResource, conversation.dataSourceId ?? null);
  const { data: currentScope } = useResource(AIChatConversationScope, AIChatConversationScopeResource, conversation.id);

  async function selectScope(scope: AiDatabaseScope) {
    if (!conversation.dataSourceId) {
      throw new Error('Conversation data source is not defined');
    }

    try {
      if (scope === AiDatabaseScope.Custom) {
        const key = conversation.dataSourceId;
        const connection = await connectionsManagerService.requireConnection(key);

        if (!connection) {
          return;
        }

        const settings = await connectionInfoAiResource.refresh(key);
        const { status, result } = await commonDialogService.open(AiScopeDialog, {
          rootId: connection.nodePath ?? NodeManagerUtils.connectionIdToConnectionNodeId(key.projectId, key.connectionId),
          selectedIds: conversation.settings?.customObjectIds ?? [],
          title: 'plugin_ai_chat_scope_custom_dialog_title',
          allowedIds: settings.scope === AiDatabaseScope.Custom ? (settings.customObjectIds ?? []) : null,
        });

        if (status !== DialogueStateResult.Resolved) {
          return;
        }

        await aiChatConversationsService.updateConversation(conversation.id, {
          settings: { customObjectIds: result },
        });
      }

      await aiChatConversationScopeResource.updateScope(conversation.id, scope);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_scope_change_fail');
    }
  }

  const scopes = useMemo(() => {
    const result: IScopeItem[] = [{ id: AiDatabaseScope.CurrentDatasource, label: translate('plugin_ai_chat_scope_connection') }];
    const fallback = translate('ui_not_selected');

    if (container?.supportsCatalogChange) {
      const defaultValue = container.defaultCatalog ?? fallback;
      result.push({ id: AiDatabaseScope.CurrentDatabase, label: `${translate('plugin_ai_chat_scope_database')} (${catalog ?? defaultValue})` });
    }

    if (container?.supportsSchemaChange) {
      const defaultValue = container.defaultSchema ?? fallback;
      result.push({ id: AiDatabaseScope.CurrentSchema, label: `${translate('plugin_ai_chat_scope_schema')} (${schema ?? defaultValue})` });
    }

    result.push({ id: AiDatabaseScope.Custom, label: translate('plugin_ai_chat_scope_custom') });
    return result;
  }, [container, catalog, schema, translate]);

  return (
    <MenuProvider placement="bottom-end">
      <MenuButton render={<ActionIconButton disabled={disabled} title={translate('plugin_ai_chat_scope_change')} name="/icons/scope.svg" img />} />
      <Menu modal fitViewport>
        <MenuGroup className="tw:flex tw:flex-col tw:gap-1">
          <MenuGroupLabel>{translate('plugin_ai_chat_scope_change')}</MenuGroupLabel>

          {scopes.map(scope => {
            const isCurrent = currentScope?.scope === scope.id;
            const label = scope.label;

            return (
              <MenuItemRadio
                key={scope.id}
                value={label}
                name={scope.id}
                aria-label={label}
                title={label}
                checked={isCurrent}
                disabled={disabled}
                className="tw:min-h-7"
                hideOnClick={scope.id === AiDatabaseScope.Custom}
                onClick={() => selectScope(scope.id)}
              >
                <div className="tw:flex tw:items-center tw:gap-2 tw:overflow-hidden">
                  <RadioIndicator size="small" checked={isCurrent} />
                  <span className="tw:truncate">{label}</span>
                </div>
              </MenuItemRadio>
            );
          })}
        </MenuGroup>

        <Placeholder container={aiChatConversationsService.menuSections} conversation={conversation} disabled={disabled} />
      </Menu>
    </MenuProvider>
  );
});
