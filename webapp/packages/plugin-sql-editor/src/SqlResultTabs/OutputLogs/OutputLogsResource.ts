/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionExecutionContextResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { ServerEventId } from '@cloudbeaver/core-root';
import type { CbDatabaseOutputLogEvent, WsOutputLogInfo } from '@cloudbeaver/core-sdk';

import type { IOutputLogType } from './IOutputLogTypes.js';
import { OutputLogsEventHandler } from './OutputLogsEventHandler.js';

export interface IOutputLog extends WsOutputLogInfo {
  severity?: IOutputLogType;
  contextId: string;
  timestamp: number;
}

@injectable()
export class OutputLogsResource extends CachedDataResource<IOutputLog[]> {
  constructor(
    sqlOutputLogsEventHandler: OutputLogsEventHandler,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
  ) {
    super(() => []);

    sqlOutputLogsEventHandler.onEvent(
      ServerEventId.CbDatabaseOutputLogUpdated,
      (event: CbDatabaseOutputLogEvent) => {
        this.collectMessagesFromEvent(event);
      },
      undefined,
      this,
    );

    // hack, we need to call this.use() to initialize resource at startup
    this.useTracker.use(undefined);

    this.connectionExecutionContextResource.onItemDelete.addHandler(key => {
      this.setData(this.data.filter(log => log.contextId !== key));
    });
  }

  private collectMessagesFromEvent(event: CbDatabaseOutputLogEvent) {
    const newLogs = event.messages.map(message => ({
      message: message.message,
      severity: message.severity,
      contextId: event.contextId,
      timestamp: event.eventTimestamp,
    })) as IOutputLog[];

    const updatedData: IOutputLog[] = (this.data || []).concat(newLogs);

    this.setData(updatedData);
  }

  override clear(): void {
    super.clear();
    this.useTracker.use(undefined);
  }

  deleteLogsByContextId(contextId: string): void {
    this.setData(this.data.filter(log => log.contextId !== contextId));
  }

  protected loader(): IOutputLog[] {
    return this.data;
  }
}
