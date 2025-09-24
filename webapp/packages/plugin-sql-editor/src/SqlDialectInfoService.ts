/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionDialectResource, type IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

@injectable(() => [ConnectionDialectResource, NotificationService])
export class SqlDialectInfoService {
  constructor(
    private readonly connectionDialectResource: ConnectionDialectResource,
    private readonly notificationService: NotificationService,
  ) {}

  async formatScript(context: IConnectionExecutionContextInfo, query: string): Promise<string> {
    try {
      return await this.connectionDialectResource.formatScript(context, query);
    } catch (error: any) {
      this.notificationService.logException(error, 'Failed to format script');
    }
    return query;
  }
}
