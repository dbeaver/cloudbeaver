/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { AIProfileCredentialsPanelService } from '../AIProfileCredentialsPanelService.js';

const AIProfileCredentialsTab = importLazyComponent(() =>
  import('../components/AIProfileCredentialsTab.js').then(module => module.AIProfileCredentialsTab),
);

@injectable(() => [AIProfileCredentialsPanelService])
export class AIProfileCredentialsFormTabBootstrap extends Bootstrap {
  constructor(private readonly aiProfileCredentialsPanelService: AIProfileCredentialsPanelService) {
    super();
  }

  override register(): void {
    this.aiProfileCredentialsPanelService.parts.add({
      key: 'credentials',
      name: 'plugin_ai_credentials_profile',
      panel: () => AIProfileCredentialsTab,
    });
  }
}
