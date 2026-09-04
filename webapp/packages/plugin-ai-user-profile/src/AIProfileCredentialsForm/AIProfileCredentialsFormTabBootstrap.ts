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

const AIProfileCredentialsFields = importLazyComponent(() =>
  import('../components/AIProfileCredentialsFields.js').then(module => module.AIProfileCredentialsFields),
);

@injectable(() => [AIProfileCredentialsPanelService])
export class AIProfileCredentialsFormTabBootstrap extends Bootstrap {
  constructor(private readonly credentialsPanelService: AIProfileCredentialsPanelService) {
    super();
  }

  override register(): void {
    this.credentialsPanelService.parts.add({
      key: 'credentials',
      name: 'plugin_ai_credentials_profile',
      panel: () => AIProfileCredentialsFields,
    });
  }
}
