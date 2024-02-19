/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ClientActivityService } from '@cloudbeaver/core-client-activity';
import { Dependency, injectable } from '@cloudbeaver/core-di';

import { SessionResource } from './SessionResource';

export const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

@injectable()
export class SessionTouchService extends Dependency {
  private touchSessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly clientActivityService: ClientActivityService, private readonly sessionResource: SessionResource) {
    super();
    this.touchSession = this.touchSession.bind(this);
    this.clientActivityService.onActiveStateChange.addHandler(this.touchSession);
  }

  private touchSession = () => {
    if (this.touchSessionTimer || !this.clientActivityService.isActive) {
      return;
    }

    this.sessionResource.touchSession();

    this.touchSessionTimer = setTimeout(() => {
      if (this.touchSessionTimer) {
        clearTimeout(this.touchSessionTimer);
        this.touchSessionTimer = null;
      }
    }, SESSION_TOUCH_TIME_PERIOD);
  };
}
