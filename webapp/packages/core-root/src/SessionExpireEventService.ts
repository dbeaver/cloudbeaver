/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import type { WsSessionExpiredEvent } from '@cloudbeaver/core-sdk';

import { ServerEventId, SessionEventSource } from './SessionEventSource.js';
import { SessionExpireService } from './SessionExpireService.js';

@injectable()
export class SessionExpireEventService extends Dependency {
  constructor(
    private readonly sessionEventSource: SessionEventSource,
    private readonly sessionExpireService: SessionExpireService,
  ) {
    super();
    this.sessionEventSource.onEvent<WsSessionExpiredEvent>(ServerEventId.CbSessionExpired, () => {
      this.onSessionExpireEvent();
    });
  }

  private onSessionExpireEvent(): void {
    this.sessionExpireService.sessionExpired();
  }
}
