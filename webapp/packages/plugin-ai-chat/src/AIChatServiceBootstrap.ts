/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { DATA_CONTEXT_SQL_EDITOR_STATE, ESqlDataSourceFeatures, SQL_EDITOR_ACTIONS_MENU, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_TOGGLE_AI_CHAT } from './actions/ACTION_TOGGLE_AI_CHAT.js';
import { AIChatService } from './AIChat/AIChatService.js';
import { AIChatAttachmentsPasteService } from './AIChatAttachments/AIChatAttachmentsPasteService.js';
import { AIChatAttachmentsService } from './AIChatAttachments/AIChatAttachmentsService.js';
import { AIChatAttachmentsImageHandlerService } from './AIChatAttachmentsHandlers/AIChatAttachmentsImageHandler/AIChatAttachmentsImageHandlerService.js';
import { AIChatFunctionsService } from './AIChatFunctionsService.js';
import { AIChatTabService } from './AIChatTabService.js';

const WelcomeAIChat = importLazyComponent(() => import('./WelcomeAIChat.js').then(m => m.WelcomeAIChat));

export class AIChatServiceBootstrapImpl extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly aiChatService: AIChatService,
    private readonly userInfoResource: UserInfoResource,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly aiChatTabService: AIChatTabService,
    private readonly aiChatFunctionsService: AIChatFunctionsService,
    private readonly aiChatAttachmentsService: AIChatAttachmentsService,
    private readonly aiChatAttachmentsPasteService: AIChatAttachmentsPasteService,
    private readonly aiChatAttachmentsImageHandlerService: AIChatAttachmentsImageHandlerService,
  ) {
    super();
  }

  override register(): void {
    this.aiChatFunctionsService.register();
    this.aiChatAttachmentsService.register();
    this.aiChatAttachmentsImageHandlerService.register();
    this.aiChatAttachmentsPasteService.register();

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

export type AIChatServiceBootstrap = AIChatServiceBootstrapImpl;

export class AIChatServiceBootstrapDI extends Context.Service<AIChatServiceBootstrapDI, AIChatServiceBootstrapImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIChatServiceBootstrap#AIChatServiceBootstrap',
) {
  static readonly implementation = AIChatServiceBootstrapImpl;

  static readonly dependencies = () =>
    [
      MenuService,
      ActionService,
      AIChatService,
      UserInfoResource,
      SqlDataSourceService,
      NavigationTabsService,
      AIChatTabService,
      AIChatFunctionsService,
      AIChatAttachmentsService,
      AIChatAttachmentsPasteService,
      AIChatAttachmentsImageHandlerService,
    ] as const;
  static readonly make: Effect.Effect<
    AIChatServiceBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof AIChatService>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof SqlDataSourceService>
    | Context.Service.Identifier<typeof NavigationTabsService>
    | Context.Service.Identifier<typeof AIChatTabService>
    | Context.Service.Identifier<typeof AIChatFunctionsService>
    | Context.Service.Identifier<typeof AIChatAttachmentsService>
    | Context.Service.Identifier<typeof AIChatAttachmentsPasteService>
    | Context.Service.Identifier<typeof AIChatAttachmentsImageHandlerService>
  > = Effect.gen(function* makeAIChatServiceBootstrap() {
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;
    const aiChatService = yield* AIChatService;
    const userInfoResource = yield* UserInfoResource;
    const sqlDataSourceService = yield* SqlDataSourceService;
    const navigationTabsService = yield* NavigationTabsService;
    const aiChatTabService = yield* AIChatTabService;
    const aiChatFunctionsService = yield* AIChatFunctionsService;
    const aiChatAttachmentsService = yield* AIChatAttachmentsService;
    const aiChatAttachmentsPasteService = yield* AIChatAttachmentsPasteService;
    const aiChatAttachmentsImageHandlerService = yield* AIChatAttachmentsImageHandlerService;

    return new AIChatServiceBootstrapImpl(
      menuService,
      actionService,
      aiChatService,
      userInfoResource,
      sqlDataSourceService,
      navigationTabsService,
      aiChatTabService,
      aiChatFunctionsService,
      aiChatAttachmentsService,
      aiChatAttachmentsPasteService,
      aiChatAttachmentsImageHandlerService,
    );
  });
  static readonly layer: Layer.Layer<
    AIChatServiceBootstrapDI,
    never,
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof AIChatService>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof SqlDataSourceService>
    | Context.Service.Identifier<typeof NavigationTabsService>
    | Context.Service.Identifier<typeof AIChatTabService>
    | Context.Service.Identifier<typeof AIChatFunctionsService>
    | Context.Service.Identifier<typeof AIChatAttachmentsService>
    | Context.Service.Identifier<typeof AIChatAttachmentsPasteService>
    | Context.Service.Identifier<typeof AIChatAttachmentsImageHandlerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatServiceBootstrap = AIChatServiceBootstrapDI;
