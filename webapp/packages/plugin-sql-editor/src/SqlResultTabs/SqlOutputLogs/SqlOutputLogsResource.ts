/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ServerEventId } from '@cloudbeaver/core-root';
import { CachedDataResource, GraphQLService, LogEntry } from '@cloudbeaver/core-sdk';

import { SqlOutputLogsEventHandler } from './SqlOutputLogsEventHandler';

export interface ILogEntry extends LogEntry {
  id: string;
}

@injectable()
export class SqlOutputLogsResource extends CachedDataResource<ILogEntry[]> {
  constructor(sqlOutputLogsEventHandler: SqlOutputLogsEventHandler, private readonly graphQLService: GraphQLService) {
    super(() => []);

    sqlOutputLogsEventHandler.onEvent(
      ServerEventId.CbDatabaseOutputLogUpdated,
      event => {
        // @ts-ignore
        console.log('onEvent', event?.messages as any);
        // @ts-ignore
        this.setData((this.data || []).concat(event?.messages as any));
        this.markOutdated();
      },
      e => e,
      this,
    );
  }

  protected async loader(): Promise<ILogEntry[]> {
    console.groupCollapsed('SqlOutputLogsResource');
    console.log('loader', this.data);
    console.groupEnd();

    return this.data;
  }
}
