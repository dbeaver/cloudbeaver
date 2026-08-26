/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { SideBarPanelService } from '@cloudbeaver/core-ui';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';

import { AIChatService } from './AIChat/AIChatService.js';
import { AIFunctionsResource } from './AIFunctionsResource.js';

const AI_CHAT_TAB_ID = 'ai-chat-tab';

const AIChatPanel = importLazyComponent(() => import('./AIChatPanel.js').then(m => m.AIChatPanel));

@injectable(() => [SideBarPanelService, AIChatService, AIFunctionsResource])
export class AIChatTabService {
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
