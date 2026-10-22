/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionFormAiService } from '../../connection-ai-settings/ConnectionFormAiService.js';

const ConnectionAiScope = importLazyComponent(() => import('./ConnectionAiScope.js').then(m => m.ConnectionAiScope));

@injectable(() => [ConnectionFormAiService])
export class ConnectionAiScopeBootstrap extends Bootstrap {
  constructor(private readonly connectionFormAiService: ConnectionFormAiService) {
    super();
  }

  override register(): void {
    this.connectionFormAiService.optionsContainer.add(ConnectionAiScope, 0);
  }
}
