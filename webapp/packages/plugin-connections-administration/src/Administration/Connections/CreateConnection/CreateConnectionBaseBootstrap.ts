/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { CreateConnectionService } from '../CreateConnectionService';

const CustomConnection = React.lazy(async () => {
  const { CustomConnection } = await import('./Manual/CustomConnection');
  return { default: CustomConnection };
});

@injectable()
export class CreateConnectionBaseBootstrap extends Bootstrap {
  constructor(private readonly createConnectionService: CreateConnectionService) {
    super();
  }

  register(): void | Promise<void> {
    this.createConnectionService.tabsContainer.add({
      key: 'manual',
      name: 'connections_connection_create_custom',
      order: 1,
      panel: () => CustomConnection,
    });
  }

  load(): void | Promise<void> {}
}
