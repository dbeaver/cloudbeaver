/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { SideBarPanelService } from '@cloudbeaver/core-ui';

import { AIChatService } from './AIChat/AIChatService.js';
import { AIFunctionsResource } from './AIFunctionsResource.js';

const AI_CHAT_TAB_ID = 'ai-chat-tab';

const AIChatPanel = importLazyComponent(() => import('./AIChatPanel.js').then(m => m.AIChatPanel));

export class AIChatTabServiceImpl {
  constructor(
    private readonly sideBarPanelService: SideBarPanelService,
    private readonly aiChatService: AIChatService,
    private readonly aiFunctionsResource: AIFunctionsResource,
  ) {}

  register(): void {
    this.sideBarPanelService.tabsContainer.add({
      key: AI_CHAT_TAB_ID,
      order: Number.MIN_SAFE_INTEGER,
      name: 'plugin_ai_chat_label',
      isHidden: () => !this.aiChatService.isActive,
      onClose: this.aiChatService.togglePanel,
      getLoader: () => [getCachedDataResourceLoaderState(this.aiFunctionsResource, () => undefined)],
      panel: () => AIChatPanel,
    });
  }

  selectTab(): void {
    this.sideBarPanelService.tabsContainer.select(AI_CHAT_TAB_ID);
  }
}

export type AIChatTabService = AIChatTabServiceImpl;

export class AIChatTabServiceDI extends Context.Service<AIChatTabServiceDI, AIChatTabServiceImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIChatTabService#AIChatTabService',
) {
  static readonly implementation = AIChatTabServiceImpl;

  static readonly dependencies = () => [SideBarPanelService, AIChatService, AIFunctionsResource] as const;
  static readonly make: Effect.Effect<
    AIChatTabServiceImpl,
    never,
    | Context.Service.Identifier<typeof SideBarPanelService>
    | Context.Service.Identifier<typeof AIChatService>
    | Context.Service.Identifier<typeof AIFunctionsResource>
  > = Effect.gen(function* makeAIChatTabService() {
    const sideBarPanelService = yield* SideBarPanelService;
    const aiChatService = yield* AIChatService;
    const aiFunctionsResource = yield* AIFunctionsResource;

    return new AIChatTabServiceImpl(sideBarPanelService, aiChatService, aiFunctionsResource);
  });
  static readonly layer: Layer.Layer<
    AIChatTabServiceDI,
    never,
    | Context.Service.Identifier<typeof SideBarPanelService>
    | Context.Service.Identifier<typeof AIChatService>
    | Context.Service.Identifier<typeof AIFunctionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatTabService = AIChatTabServiceDI;
