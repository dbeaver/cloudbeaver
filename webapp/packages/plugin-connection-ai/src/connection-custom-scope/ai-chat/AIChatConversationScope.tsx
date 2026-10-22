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
import { useService } from '@cloudbeaver/core-di';
import { ConnectionInfoResource, ContainerResource } from '@cloudbeaver/core-connections';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { AIChatConversationProfile, EAIConversationPromptGeneratorId, type AIChatHeaderActionsProps } from '@cloudbeaver/plugin-ai-chat';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { AIChatConversationScopeResource } from './AIChatConversationScopeResource.js';
import { AIChatScopeService } from './AIChatScopeService.js';

interface IScopeItem {
  id: AiDatabaseScope;
  label: string;
}

export const AIChatConversationScope = observer<AIChatHeaderActionsProps>(function AIChatConversationScope(props) {
  const { data: connection } = useResource(AIChatConversationScope, ConnectionInfoResource, props.conversation.dataSourceId ?? null);

  if (props.conversation.promptGeneratorId === EAIConversationPromptGeneratorId.OBJECT_DESCRIBE || !connection?.connected) {
    return null;
  }

  return <AIChatConversationScopeMenu {...props} />;
});

const AIChatConversationScopeMenu = observer<AIChatHeaderActionsProps>(function AIChatConversationScopeMenu({
  conversation,
  catalog,
  schema,
  disabled,
}) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const aiChatScopeService = useService(AIChatScopeService);

  const { data: container } = useResource(AIChatConversationScopeMenu, ContainerResource, conversation.dataSourceId ?? null);
  const { data: currentScope } = useResource(AIChatConversationScopeMenu, AIChatConversationScopeResource, conversation.id);
  const aiProfilesResource = useResource(AIChatConversationScopeMenu, AIProfilesResource, CachedMapAllKey);
  const profiles = aiProfilesResource.data.filter(isNotNullDefined);

  async function selectScope(scope: AiDatabaseScope) {
    if (!conversation.dataSourceId) {
      throw new Error('Conversation data source is not defined');
    }

    try {
      await aiChatScopeService.selectScope(conversation, scope);
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

        <AIChatConversationProfile conversation={conversation} profiles={profiles} disabled={disabled} />
      </Menu>
    </MenuProvider>
  );
});
