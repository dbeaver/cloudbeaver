/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppAuthService } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';
import { UserProfileTabsService } from '@cloudbeaver/plugin-user-profile';

import { AI_PROFILES_TAB_ID } from './AI_PROFILES_TAB_ID.js';

const AIProfilesPanel = importLazyComponent(() => import('./components/AIProfilesPanel.js').then(module => module.AIProfilesPanel));

@injectable(() => [UserProfileTabsService, AppAuthService, ServerConfigResource, AIProfilesResource])
export class AIUserProfileBootstrap extends Bootstrap {
  constructor(
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly appAuthService: AppAuthService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly aiProfilesResource: AIProfilesResource,
  ) {
    super();
  }

  override register(): void {
    this.userProfileTabsService.tabContainer.add({
      key: AI_PROFILES_TAB_ID,
      name: 'plugin_ai_user_profile_tab_label',
      order: 4,
      getLoader: () =>
        getCachedMapResourceLoaderState(this.aiProfilesResource, () =>
          this.appAuthService.authenticated && this.serverConfigResource.isFeatureEnabled(FEATURE_AI_ID, true) ? CachedMapAllKey : null,
        ),
      isHidden: () => !this.isAvailable(),
      panel: () => AIProfilesPanel,
    });
  }

  private isAvailable(): boolean {
    return (
      this.appAuthService.authenticated &&
      this.serverConfigResource.isFeatureEnabled(FEATURE_AI_ID, true) &&
      this.aiProfilesResource.values.length > 0
    );
  }
}
