/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { UserDataService } from '@cloudbeaver/core-authentication';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';

import { AIChatContextService } from './AIChatContext/AIChatContextService.js';
import { AIChatSettingsService } from '../AIChatSettingsService.js';

const queryAiChatSettingsKey = 'ai-chat';

interface ISettings {
  active: boolean;
  metrics: boolean;
}

@injectable(() => [ServerConfigResource, UserDataService, AIChatContextService, AIChatSettingsService])
export class AIChatService {
  get settings(): ISettings {
    return this.userDataService.getUserData(queryAiChatSettingsKey, getAiChatDefaultSettings);
  }

  get isEnabled(): boolean {
    return !this.aiChatSettingsService.disabled && this.serverConfigResource.isFeatureEnabled(FEATURE_AI_ID, true);
  }

  get metrics(): boolean {
    return this.settings.metrics;
  }

  get isActive(): boolean {
    return this.isEnabled && this.settings.active;
  }

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly userDataService: UserDataService,
    private readonly aiChatContextService: AIChatContextService,
    private readonly aiChatSettingsService: AIChatSettingsService,
  ) {
    this.togglePanel = this.togglePanel.bind(this);

    makeObservable(this, {
      isEnabled: computed,
      isActive: computed,
    });
  }

  togglePanel(): void {
    const wasActive = this.settings.active;

    runInAction(() => {
      this.settings.active = !this.settings.active;

      if (!wasActive && !this.aiChatContextService.currentContext) {
        this.aiChatContextService.setContext(this.aiChatContextService.getContext());
      }
    });
  }

  toggleMetrics(): void {
    this.settings.metrics = !this.settings.metrics;
  }
}

function getAiChatDefaultSettings(): ISettings {
  return {
    active: false,
    metrics: false,
  };
}
