/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppAuthService } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';
import { UserProfileTabsService } from '@cloudbeaver/plugin-user-profile';

import { AI_PROFILES_TAB_ID } from './AI_PROFILES_TAB_ID.js';
import { AIProfilesSettingsService } from './AIProfilesSettingsService.js';

const AIProfilesPanel = importLazyComponent(() => import('./components/AIProfilesPanel.js').then(module => module.AIProfilesPanel));

export class AIUserProfileBootstrapImpl extends Bootstrap {
  constructor(
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly appAuthService: AppAuthService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiProfilesSettingsService: AIProfilesSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.userProfileTabsService.tabContainer.add({
      key: AI_PROFILES_TAB_ID,
      name: 'plugin_ai_user_profile_tab_label',
      icon: '/icons/core_blocks_sparkles.svg',
      order: 4,
      getLoader: () => getCachedMapResourceLoaderState(this.aiProfilesResource, () => CachedMapAllKey),
      isHidden: () => !this.isAvailable(),
      panel: () => AIProfilesPanel,
    });
  }

  private isAvailable(): boolean {
    return (
      this.appAuthService.authenticated &&
      !this.aiProfilesSettingsService.disabled &&
      this.serverConfigResource.isFeatureEnabled(FEATURE_AI_ID, true) &&
      this.aiProfilesResource.values.length > 0
    );
  }
}

export type AIUserProfileBootstrap = AIUserProfileBootstrapImpl;

export class AIUserProfileBootstrapDI extends Context.Service<AIUserProfileBootstrapDI, AIUserProfileBootstrapImpl>()(
  '@cloudbeaver/plugin-ai-user-profile/AIUserProfileBootstrap#AIUserProfileBootstrap',
) {
  static readonly implementation = AIUserProfileBootstrapImpl;

  static readonly dependencies = () =>
    [UserProfileTabsService, AppAuthService, ServerConfigResource, AIProfilesResource, AIProfilesSettingsService] as const;
  static readonly make: Effect.Effect<
    AIUserProfileBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof UserProfileTabsService>
    | Context.Service.Identifier<typeof AppAuthService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof AIProfilesResource>
    | Context.Service.Identifier<typeof AIProfilesSettingsService>
  > = Effect.gen(function* makeAIUserProfileBootstrap() {
    const userProfileTabsService = yield* UserProfileTabsService;
    const appAuthService = yield* AppAuthService;
    const serverConfigResource = yield* ServerConfigResource;
    const aiProfilesResource = yield* AIProfilesResource;
    const aiProfilesSettingsService = yield* AIProfilesSettingsService;

    return new AIUserProfileBootstrapImpl(
      userProfileTabsService,
      appAuthService,
      serverConfigResource,
      aiProfilesResource,
      aiProfilesSettingsService,
    );
  });
  static readonly layer: Layer.Layer<
    AIUserProfileBootstrapDI,
    never,
    | Context.Service.Identifier<typeof UserProfileTabsService>
    | Context.Service.Identifier<typeof AppAuthService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof AIProfilesResource>
    | Context.Service.Identifier<typeof AIProfilesSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIUserProfileBootstrap = AIUserProfileBootstrapDI;
