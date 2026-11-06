/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { SidebarActivationService, SideBarPanelService } from '@cloudbeaver/core-ui';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';

import { AIChatService } from './AIChat/AIChatService.js';
import { AIFunctionsResource } from './AIFunctionsResource.js';

const AI_CHAT_TAB_ID = 'ai-chat-tab';

const AIChatPanel = importLazyComponent(() => import('./AIChatPanel.js').then(m => m.AIChatPanel));

@injectable(() => [SideBarPanelService, AIChatService, AIFunctionsResource, SidebarActivationService])
export class AIChatTabService {
  constructor(
    private readonly sideBarPanelService: SideBarPanelService,
    private readonly aiChatService: AIChatService,
    private readonly aiFunctionsResource: AIFunctionsResource,
    private readonly sidebarActivationService: SidebarActivationService,
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
    this.sidebarActivationService.reveal(AI_CHAT_TAB_ID);
  }

  open(): void {
    if (!this.aiChatService.isEnabled) {
      return;
    }

    if (!this.aiChatService.isActive) {
      this.aiChatService.togglePanel();
    }

    this.selectTab();
  }

  toggle(): void {
    if (this.sidebarActivationService.isRevealed(AI_CHAT_TAB_ID)) {
      this.aiChatService.togglePanel();
    } else {
      this.open();
    }
  }
}
