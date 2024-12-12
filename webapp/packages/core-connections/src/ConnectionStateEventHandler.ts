/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { WsDataSourceConnectEvent, WsDataSourceDisconnectEvent } from '@cloudbeaver/core-sdk';

export type IWsDataSourceDisconnectEvent = WsDataSourceDisconnectEvent;
export type IWsDataSourceConnectEvent = WsDataSourceConnectEvent;

type ConnectionStateEvent = IWsDataSourceConnectEvent | IWsDataSourceDisconnectEvent;

@injectable()
export class ConnectionStateEventHandler extends TopicEventHandler<ConnectionStateEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbDatasourceConnection, sessionEventSource);
  }

  map(event: any): ConnectionStateEvent {
    return event;
  }
}
