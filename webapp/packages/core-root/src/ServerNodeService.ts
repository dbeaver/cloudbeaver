/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { GraphQLService, type WsSocketConnectedEvent } from '@cloudbeaver/core-sdk';

import { ServerNodeError } from './ServerNodeError.js';
import { ServerEventId, SessionEventSource } from './SessionEventSource.js';

@injectable()
export class ServerNodeService extends Dependency {
  private applicationRunId: string | null;
  onApplicationRunIdChange: IExecutor;
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionEventSource: SessionEventSource,
  ) {
    super();
    this.onApplicationRunIdChange = new Executor();
    this.applicationRunId = null;
    this.sessionEventSource.onEvent<WsSocketConnectedEvent>(ServerEventId.CbSessionWebsocketConnected, data => {
      this.applicationRunIdChanged(data.applicationRunId);
    });
  }

  private applicationRunIdChanged(applicationRunId: string): void {
    if (this.applicationRunId === null) {
      this.applicationRunId = applicationRunId;
      return;
    }

    if (this.applicationRunId === applicationRunId) {
      return;
    }

    this.applicationRunId = applicationRunId;
    this.graphQLService.blockRequests(new ServerNodeError('Server node changed'));
    this.sessionEventSource.disconnect();
    this.onApplicationRunIdChange.execute();
  }
}
