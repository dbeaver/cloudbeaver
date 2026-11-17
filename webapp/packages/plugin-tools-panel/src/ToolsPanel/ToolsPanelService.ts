/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { ToolsPanelSettingsService } from '../ToolsPanelSettingsService.js';

@injectable(() => [ToolsPanelSettingsService])
export class ToolsPanelService {
  get disabled(): boolean {
    return this.toolsPanelSettingsService.disabled;
  }

  constructor(private readonly toolsPanelSettingsService: ToolsPanelSettingsService) {
    makeObservable(this, {
      disabled: computed,
    });
  }
}
