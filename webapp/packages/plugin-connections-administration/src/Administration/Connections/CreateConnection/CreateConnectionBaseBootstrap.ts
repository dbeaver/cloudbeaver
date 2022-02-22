/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { CreateConnectionService } from '../CreateConnectionService';
import { ConnectionManualService } from './Manual/ConnectionManualService';
import { CustomConnection } from './Manual/CustomConnection';
import { ConnectionSearchService } from './Search/ConnectionSearchService';
import { SearchDatabase } from './Search/SearchDatabase';

@injectable()
export class CreateConnectionBaseBootstrap extends Bootstrap {
  constructor(
    private readonly createConnectionService: CreateConnectionService,
    private readonly connectionManualService: ConnectionManualService,
    private readonly connectionSearchService: ConnectionSearchService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.createConnectionService.tabsContainer.add({
      key: 'manual',
      name: 'connections_connection_create_custom',
      order: 1,
      panel: () => CustomConnection,
    });
    this.createConnectionService.tabsContainer.add({
      key: 'search',
      name: 'connections_connection_create_search_database',
      order: 2,
      panel: () => SearchDatabase,
      onOpen: () => this.connectionSearchService.load(),
      options: {
        configurationWizard: {
          activationPriority: 2,
        },
        close: () => this.connectionSearchService.close(),
      },
    });
  }

  load(): void | Promise<void> { }
}
