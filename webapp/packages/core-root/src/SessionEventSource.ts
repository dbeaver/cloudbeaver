/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { io, Socket } from 'socket.io-client';

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  EventSource,
  CbEvent,
  CbEventType as SessionEventType
} from '@cloudbeaver/core-sdk';

import { getSocketIterable, isEventReserved } from './getSocketIterable';

export type SessionEvent = Record<string, any>;
export { SessionEventType };

@injectable()
export class SessionEventSource extends EventSource<Record<string, any>> {
  private readonly socket: Socket;

  private websocketMode: boolean;
  constructor(
    private readonly graphQLService: GraphQLService
  ) {
    super(5000);
    this.websocketMode = true;
    this.socket = io({
      autoConnect: false,
    });
  }

  protected async listener(): Promise<void> {
    if (this.websocketMode) {
      this.socket.connect();
      const iterableSocket = getSocketIterable<CbEvent>(this.socket);

      for await (const event of iterableSocket) {
        if (event) {
          if (isEventReserved(event)) {
            if (event.reason === 'io client disconnect') {
              return;
            }
            if (event.reason === 'io server disconnect') {
              return;
            }
          } else {
            this.event(event.data.eventType, event.data);
          }
        }
      }
    }

    const { events } = await this.graphQLService.sdk.getSessionEvents({
      maxEntries: 1000,
    });

    for (const event of events) {
      if ((event.eventType as string) === 'cb_websocket') {
        this.websocketMode = true;
      }
      this.event(event.eventType, event);
    }
  }

  protected sender(event: string, data: void): Promise<void> {
    throw new Error('Method not implemented.');
  }

  protected idle(): void {
    this.socket.disconnect();
  }
}
