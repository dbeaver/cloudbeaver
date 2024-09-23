/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';

import { ToolsPanelSettingsService } from '../ToolsPanelSettingsService.js';

@injectable()
export class ToolsPanelService {
  readonly tabsContainer: TabsContainer;

  get disabled() {
    return this.toolsPanelSettingsService.disabled;
  }

  constructor(private readonly toolsPanelSettingsService: ToolsPanelSettingsService) {
    this.tabsContainer = new TabsContainer('Tools');

    makeObservable(this, {
      disabled: computed,
    });
  }
}
