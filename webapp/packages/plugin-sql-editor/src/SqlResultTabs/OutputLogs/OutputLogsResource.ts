/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ServerEventId } from '@cloudbeaver/core-root';
import { CachedDataResource, CbServerEvent, GraphQLService } from '@cloudbeaver/core-sdk';

import { OutputLogsEventHandler } from './OutputLogsEventHandler';
import type { OutputLogType } from './useOutputLogsPanelState';

export interface IOutputLog {
  message: string;
  severity: OutputLogType;
}

interface IOutputLogEvent extends CbServerEvent {
  eventTimestamp: number;
  timestamp: number;
  asyncTaskId: number;
  messages: IOutputLog[];
}

@injectable()
export class OutputLogsResource extends CachedDataResource<IOutputLog[]> {
  constructor(sqlOutputLogsEventHandler: OutputLogsEventHandler, private readonly graphQLService: GraphQLService) {
    super(() => []);

    sqlOutputLogsEventHandler.onEvent(
      ServerEventId.CbDatabaseOutputLogUpdated,
      (event: IOutputLogEvent) => {
        console.log('event', event);
        this.setData((this.data || []).concat(event.messages));
        this.markOutdated();
      },
      undefined,
      this,
    );
  }

  protected async loader(): Promise<IOutputLog[]> {
    return this.data;
  }
}
