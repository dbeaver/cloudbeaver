/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionFormService } from '../ConnectionFormService.js';

export const Options = React.lazy(async () => {
  const { Options } = await import('./Options.js');
  return { default: Options };
});

@injectable()
export class ConnectionOptionsTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'options',
      name: 'plugin_connections_connection_form_part_main',
      order: 1,
      panel: () => Options,
    });
  }
}
