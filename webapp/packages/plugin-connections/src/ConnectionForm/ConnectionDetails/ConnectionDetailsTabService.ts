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
import { CONNECTION_FORM_CONNECTION_DETAILS_TAB_ID } from './CONNECTION_FORM_CONNECTION_DETAILS_TAB_ID.js';

const ConnectionDetails = importLazyComponent(() => import('./ConnectionDetails.js').then(m => m.ConnectionDetails));
const ConnectionDetailsTab = importLazyComponent(() => import('./ConnectionDetailsTab.js').then(m => m.ConnectionDetailsTab));

@injectable(() => [ConnectionFormService])
export class ConnectionDetailsTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: CONNECTION_FORM_CONNECTION_DETAILS_TAB_ID,
      name: 'plugin_connections_connection_form_connection_details',
      title: 'plugin_connections_connection_form_connection_details',
      icon: '/icons/core_blocks_key.svg',
      order: 8,
      tab: () => ConnectionDetailsTab,
      panel: () => ConnectionDetails,
    });
  }
}
