/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionFormService } from '../ConnectionFormService.js';

const AdvancedSettings = importLazyComponent(() => import('./AdvancedSettings.js').then(m => m.AdvancedSettings));

@injectable(() => [ConnectionFormService])
export class AdvancedSettingsTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'advanced_settings',
      name: 'plugin_connections_connection_form_part_advanced',
      icon: '/icons/plugin_connection_bulleted_list.svg',
      order: 9,
      panel: () => AdvancedSettings,
    });
  }
}
