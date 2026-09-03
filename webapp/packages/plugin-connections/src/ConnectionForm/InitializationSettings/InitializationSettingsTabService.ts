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

const InitializationSettings = importLazyComponent(() => import('./InitializationSettings.js').then(m => m.InitializationSettings));

@injectable(() => [ConnectionFormService])
export class InitializationSettingsTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'initialization_settings',
      name: 'plugin_connections_connection_form_part_initialization_settings',
      icon: '/icons/plugin_connection_vertical_sliders.svg',
      order: 10,
      panel: () => InitializationSettings,
    });
  }
}
