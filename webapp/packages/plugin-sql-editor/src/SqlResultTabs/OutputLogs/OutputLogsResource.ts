/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ServerEventId } from '@cloudbeaver/core-root';
import { CachedDataResource, CbDatabaseOutputLogEvent, GraphQLService } from '@cloudbeaver/core-sdk';

import { OutputLogsEventHandler } from './OutputLogsEventHandler';

@injectable()
export class OutputLogsResource extends CachedDataResource<CbDatabaseOutputLogEvent[]> {
  constructor(sqlOutputLogsEventHandler: OutputLogsEventHandler, private readonly graphQLService: GraphQLService) {
    super(() => []);

    sqlOutputLogsEventHandler.onEvent(
      ServerEventId.CbDatabaseOutputLogUpdated,
      (event: CbDatabaseOutputLogEvent) => {
        this.setData((this.data || []).concat(event));
      },
      undefined,
      this,
    );
  }

  protected async loader(): Promise<CbDatabaseOutputLogEvent[]> {
    return this.data;
  }
}
