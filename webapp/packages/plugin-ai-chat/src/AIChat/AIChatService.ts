/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, runInAction } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { UserConfigurationStorage, UserDataService } from '@cloudbeaver/core-authentication';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';

import { AIChatContextService } from './AIChatContext/AIChatContextService.js';
import { AIChatSettingsService } from '../AIChatSettingsService.js';

const queryAiChatSettingsKey = 'ai-chat';

interface ISettings {
  active: boolean;
  metrics: boolean;
}

export class AIChatServiceImpl {
  get settings(): ISettings {
    return this.userDataService.withStorage(this.userConfigurationStorage).getUserData(queryAiChatSettingsKey, getAiChatDefaultSettings);
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
    private readonly userConfigurationStorage: UserConfigurationStorage,
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

export type AIChatService = AIChatServiceImpl;

export class AIChatServiceDI extends Context.Service<AIChatServiceDI, AIChatServiceImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIChat/AIChatService#AIChatService',
) {
  static readonly implementation = AIChatServiceImpl;
  static readonly dependencies = () =>
    [ServerConfigResource, UserDataService, AIChatContextService, AIChatSettingsService, UserConfigurationStorage] as const;
  static readonly make: Effect.Effect<
    AIChatServiceImpl,
    never,
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof AIChatContextService>
    | Context.Service.Identifier<typeof AIChatSettingsService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Effect.gen(function* makeAIChatService() {
    const serverConfigResource = yield* ServerConfigResource;
    const userDataService = yield* UserDataService;
    const aiChatContextService = yield* AIChatContextService;
    const aiChatSettingsService = yield* AIChatSettingsService;
    const userConfigurationStorage = yield* UserConfigurationStorage;
    return new AIChatServiceImpl(serverConfigResource, userDataService, aiChatContextService, aiChatSettingsService, userConfigurationStorage);
  });
  static readonly layer: Layer.Layer<
    AIChatServiceDI,
    never,
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof AIChatContextService>
    | Context.Service.Identifier<typeof AIChatSettingsService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatService = AIChatServiceDI;
