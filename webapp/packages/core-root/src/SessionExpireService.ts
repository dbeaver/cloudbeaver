/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { GQLError, GraphQLService, EServerErrorCode } from '@cloudbeaver/core-sdk';
import { getCookies } from '@cloudbeaver/core-utils';

import { ServerConfigResource } from './ServerConfigResource';
import { SessionError } from './SessionError';

const SESSION_COOKIE_NAME = 'cb-session';
const WARN_IN = 5 * 1000 * 60;
const POLL_INTERVAL = 1 * 1000 * 60;

@injectable()
export class SessionExpireService extends Bootstrap {
  sessionExpired = false;
  private warned = false;

  onSessionExpire: IExecutor;
  onSessionExpireWarning: IExecutor;
  constructor(
    private graphQLService: GraphQLService,
    private serverConfigResource: ServerConfigResource,
  ) {
    super();
    this.onSessionExpire = new Executor();
    this.onSessionExpireWarning = new Executor();
  }

  register(): void {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  load(): void {
    this.startSessionPolling();
  }

  private startSessionPolling() {
    const poll = () => {
      const sessionDuration = this.serverConfigResource.data?.sessionExpireTime;
      const cookies = getCookies();

      if (this.sessionExpired || !sessionDuration || !Object.keys(cookies).length) {
        return;
      }

      const sessionExpiredTime = cookies[SESSION_COOKIE_NAME];

      if (!sessionExpiredTime) {
        this.handleSessionExpired();
        return;
      }

      if (sessionDuration > WARN_IN) {
        const remainingTime = new Date(sessionExpiredTime).getTime() - Date.now();

        if (remainingTime < WARN_IN && !this.warned) {
          this.warned = true;
          this.onSessionExpireWarning.execute().finally(() => {
            this.warned = false;
          });
        }
      }
      setTimeout(poll, POLL_INTERVAL);
    };

    setTimeout(poll, POLL_INTERVAL);
  }

  private handleSessionExpired() {
    const e = new SessionError('Session expired');
    this.graphQLService.blockRequests(e);
    this.sessionExpired = true;
    this.onSessionExpire.execute();
  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception) {
      if (exception instanceof GQLError
        && exception.errorCode === EServerErrorCode.sessionExpired
        && !this.sessionExpired) {
        this.handleSessionExpired();
      }
      throw exception;
    }
  }
}
