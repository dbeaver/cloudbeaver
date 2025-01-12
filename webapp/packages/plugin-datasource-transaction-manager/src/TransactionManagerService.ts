/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionExecutionContextService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';

@injectable()
export class TransactionManagerService {
  constructor(
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
  ) {}

  getActiveContextTransaction() {
    const context = this.connectionSchemaManagerService.activeExecutionContext;

    if (!context) {
      return;
    }

    return this.connectionExecutionContextService.get(context.id);
  }
}
