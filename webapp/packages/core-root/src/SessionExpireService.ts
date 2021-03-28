/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject } from 'rxjs';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import {
  GQLError, GraphQLService, EServerErrorCode
} from '@cloudbeaver/core-sdk';

import { SessionError } from './SessionError';

@injectable()
export class SessionExpireService extends Bootstrap {
  private isNotifiedAboutExpiredSession = false;

  onSessionExpire = new Subject();
  constructor(
    private graphQLService: GraphQLService
  ) {
    super();
  }

  register(): void {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  load(): void {}

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception) {
      if (exception instanceof GQLError
        && exception.errorCode === EServerErrorCode.sessionExpired
        && !this.isNotifiedAboutExpiredSession) {
        const e = new SessionError('Session expired');
        this.graphQLService.blockRequests(e);
        this.isNotifiedAboutExpiredSession = true;
        this.onSessionExpire.next();
      }
      throw exception;
    }
  }
}
