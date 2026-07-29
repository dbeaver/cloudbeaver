/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { Menu, MenuProvider, MenuButton, MenuItemRadio, MenuGroup, MenuGroupLabel } from '@dbeaver/ui-kit';
import { ActionIconButton, RadioIndicator, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { useService } from '@cloudbeaver/core-di';
import { ConnectionsManagerService, ContainerResource } from '@cloudbeaver/core-connections';
import { NotificationService } from '@cloudbeaver/core-events';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';

import { AIChatConversationScopeCustomDialog } from './AIChatConversationScopeCustom/AIChatConversationScopeCustomDialog.js';
import { AIChatConversationProfile } from './AIChatConversationProfile.js';
import { AIChatProfilesResource } from '../../../AIChatProfilesResource.js';
import type { AIChatConversationInfo } from '../AIChatConversationsResource.js';
import { AIChatConversationsService } from '../AIChatConversationsService.js';
import { AIChatConversationScopeResource } from '../AIChatConversationScopeResource.js';

interface IScopeItem {
  id: AiDatabaseScope;
  label: string;
}

interface Props {
  conversation: AIChatConversationInfo;
  catalog?: string;
  schema?: string;
  disabled?: boolean;
}

export const AIChatConversationScope = observer<Props>(function AIChatConversationScope({ conversation, catalog, schema, disabled }) {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const aiChatConversationsService = useService(AIChatConversationsService);

  const { data: container } = useResource(AIChatConversationScope, ContainerResource, conversation.dataSourceId ?? null);
  const { data: currentScope } = useResource(AIChatConversationScope, AIChatConversationScopeResource, conversation.id);
  const { data: profiles } = useResource(AIChatConversationScope, AIChatProfilesResource, undefined);

  async function selectScope(scope: AiDatabaseScope) {
    if (!conversation.dataSourceId) {
      throw new Error('Conversation data source is not defined');
    }

    try {
      if (scope === AiDatabaseScope.Custom) {
        const nodes = conversation.settings?.customObjectIds ?? [];
        const connection = await connectionsManagerService.requireConnection(conversation.dataSourceId);

        if (!connection) {
          return;
        }

        const { status, result } = await commonDialogService.open(AIChatConversationScopeCustomDialog, {
          connectionKey: conversation.dataSourceId,
          nodes,
        });

        if (status !== DialogueStateResult.Resolved) {
          return;
        }

        await aiChatConversationsService.updateConversation(conversation.id, {
          settings: {
            customObjectIds: result,
          },
        });
      }

      await aiChatConversationsService.updateConversationScope(conversation.id, scope);
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
      <Menu modal>
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

        <AIChatConversationProfile conversation={conversation} profiles={profiles} disabled={disabled} />
      </Menu>
    </MenuProvider>
  );
});
