/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ClientActivityService } from '@cloudbeaver/core-activity';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { EServerErrorCode, GQLError, GraphQLService, SessionError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

import { SessionResource } from './SessionResource';

export const SESSION_EXPIRE_WARN_IN_TIME = 5 * 1000 * 60;
export const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

@injectable()
export class SessionExpireService extends Bootstrap {
  expired = false;
  private touchSessionTimer: ReturnType<typeof setTimeout> | null = null;

  onSessionExpire: IExecutor;
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly clientActivityService: ClientActivityService,
    private readonly sessionResource: SessionResource,
  ) {
    super();

    this.touchSession = this.touchSession.bind(this);
    this.sessionExpired = this.sessionExpired.bind(this);

    this.onSessionExpire = new Executor();
    this.clientActivityService.onActiveStateChange.addHandler(this.touchSession);
  }

  register(): void {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  load(): void {}

  sessionExpired(): void {
    if (this.expired) {
      return;
    }

    const e = new SessionError('Session expired');
    this.graphQLService.blockRequests(e);
    this.expired = true;
    this.onSessionExpire.execute();
  }

  touchSession(force?: boolean): void {
    if (this.touchSessionTimer || !this.clientActivityService.isActive || !force) {
      return;
    }

    this.sessionResource.touchSession();

    this.touchSessionTimer = setTimeout(() => {
      if (this.touchSessionTimer) {
        clearTimeout(this.touchSessionTimer);
        this.touchSessionTimer = null;
      }
    }, SESSION_TOUCH_TIME_PERIOD);
  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception: any) {
      const gqlError = errorOf(exception, GQLError);
      if (gqlError?.errorCode === EServerErrorCode.sessionExpired) {
        this.sessionExpired();
      }
      throw exception;
    }
  }
}
