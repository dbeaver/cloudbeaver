/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { EServerErrorCode, GQLError, GraphQLService, SessionError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

export const SESSION_EXPIRE_MIN_TIME = 5 * 1000 * 60;

@injectable()
export class SessionExpireService extends Bootstrap {
  private isExpired = false;

  onSessionExpire: IExecutor;
  constructor(private readonly graphQLService: GraphQLService) {
    super();

    this.sessionExpired = this.sessionExpired.bind(this);

    this.onSessionExpire = new Executor();
  }

  get expired() {
    return this.isExpired;
  }

  override register(): void {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  sessionExpired(): void {
    if (this.expired) {
      return;
    }

    const e = new SessionError('Session expired');
    this.graphQLService.blockRequests(e);
    this.isExpired = true;
    this.onSessionExpire.execute();
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
