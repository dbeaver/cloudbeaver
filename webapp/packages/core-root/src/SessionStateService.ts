/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import type { WsSessionStateEvent } from '@cloudbeaver/core-sdk';

import { ServerEventId, SessionEventSource } from './SessionEventSource';

interface ISessionState {
  isValid?: boolean;
  remainingTime?: number;
}

@injectable()
export class SessionStateService extends Dependency {
  onSessionStateChange: IExecutor<ISessionState>;
  constructor(
    private readonly sessionEventSource: SessionEventSource
  ) {
    super();
    this.onSessionStateChange = new Executor();
    this.sessionEventSource.onEvent<WsSessionStateEvent>(ServerEventId.CbSessionState, data => {
      this.sessionStateChanged(data.isValid, data.remainingTime);
    });
  }

  private sessionStateChanged(isValid?: boolean, remainingTime?: string): void {
    const remainingTimeNumber = Number(remainingTime);
    const remainingTimeValid = !isNaN(remainingTimeNumber) ? remainingTimeNumber : Number.MAX_SAFE_INTEGER;

    this.onSessionStateChange.execute({ isValid, remainingTime: remainingTimeValid });
  }
}
