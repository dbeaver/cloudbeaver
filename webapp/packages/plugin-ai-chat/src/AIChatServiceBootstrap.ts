/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { DATA_CONTEXT_SQL_EDITOR_STATE, ESqlDataSourceFeatures, SQL_EDITOR_ACTIONS_MENU, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { AIChatService } from './AIChat/AIChatService.js';
import { ACTION_TOGGLE_AI_CHAT } from './actions/ACTION_TOGGLE_AI_CHAT.js';
import { AIChatTabService } from './AIChatTabService.js';

const WelcomeAIChat = importLazyComponent(() => import('./WelcomeAIChat.js').then(m => m.WelcomeAIChat));

@injectable(() => [MenuService, ActionService, AIChatService, UserInfoResource, SqlDataSourceService, NavigationTabsService, AIChatTabService])
export class AIChatServiceBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly aiChatService: AIChatService,
    private readonly userInfoResource: UserInfoResource,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly aiChatTabService: AIChatTabService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [...items, ACTION_TOGGLE_AI_CHAT],
    });

    this.actionService.addHandler({
      id: 'ai-chat-base',
      actions: [ACTION_TOGGLE_AI_CHAT],
      isHidden: () => !this.aiChatService.isEnabled,
      isChecked: () => this.aiChatService.isActive,
      getLoader: () => [getCachedDataResourceLoaderState(this.userInfoResource, () => undefined)],
      getActionInfo: (context, action) => {
        if (action === ACTION_TOGGLE_AI_CHAT) {
          const menu = context.get(DATA_CONTEXT_MENU);

          if (menu === MENU_APP_ACTIONS) {
            return { ...action.info, label: '', icon: '/icons/ai_toggle.svg' };
          }

          return action.info;
        }

        return action.info;
      },
      handler: (context, action) => {
        switch (action) {
          case ACTION_TOGGLE_AI_CHAT: {
            this.aiChatService.togglePanel();
            break;
          }
        }
      },
    });

    this.menuService.addCreator({
      menus: [SQL_EDITOR_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      getItems: (context, items) => [...items, ACTION_TOGGLE_AI_CHAT],
      isApplicable: context => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
        const dataSource = this.sqlDataSourceService.get(state.editorId);

        return !!dataSource?.hasFeature(ESqlDataSourceFeatures.script);
      },
    });

    this.aiChatTabService.register();
    this.navigationTabsService.welcomeContainer.add(WelcomeAIChat, undefined, () => !this.aiChatService.isEnabled);
  }
}
