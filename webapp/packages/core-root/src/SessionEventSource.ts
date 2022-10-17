/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  EventSource,
  CbEvent,
  CbEventType as SessionEventType
} from '@cloudbeaver/core-sdk';

export type SessionEvent = CbEvent;
export { SessionEventType };

@injectable()
export class SessionEventSource extends EventSource<SessionEvent> {
  constructor(
    private readonly graphQLService: GraphQLService
  ) {
    super(5000);
  }
  protected async listener(): Promise<void> {
    const { events } = await this.graphQLService.sdk.getSessionEvents({
      maxEntries: 1000,
    });

    for (const event of events) {
      this.event(event);
    }
  }
}
