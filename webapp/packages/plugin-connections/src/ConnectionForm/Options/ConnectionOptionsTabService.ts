/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionFormService } from '../ConnectionFormService.js';

const MainProviderPropertiesForm = importLazyComponent(() => import('./MainProviderPropertiesForm.js').then(m => m.MainProviderPropertiesForm));

export const Options = React.lazy(async () => {
  const { OptionsPanel } = await import('./OptionsPanel.js');
  return { default: OptionsPanel };
});

@injectable(() => [ConnectionFormService])
export class ConnectionOptionsTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.mainPropertiesContainer.add(MainProviderPropertiesForm);
    this.connectionFormService.parts.add({
      key: 'options',
      name: 'plugin_connections_connection_form_part_main',
      title: 'plugin_connections_connection_form_part_main',
      icon: '/icons/plugin_connection_plug.svg',
      order: 1,
      panel: () => Options,
    });
  }
}
