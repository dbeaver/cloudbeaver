/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { AIProfileFormService } from './AIProfileFormService.js';

const AIProfileOptions = importLazyComponent(() => import('./Options/AIProfileOptions.js').then(m => m.AIProfileOptions));

@injectable(() => [AIProfileFormService])
export class AIProfileFormTabBootstrap extends Bootstrap {
  constructor(private readonly aiProfileFormService: AIProfileFormService) {
    super();
  }

  override register(): void {
    this.aiProfileFormService.parts.add({
      key: 'options',
      name: 'plugin_ai_administration_profile_form_tab_options',
      order: 1,
      panel: () => AIProfileOptions,
    });
  }
}
