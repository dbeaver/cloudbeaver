/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';
import {
  GQLError, GraphQLService, EServerErrorCode
} from '@cloudbeaver/core-sdk';

import { CommonDialogService } from '../CommonDialog/CommonDialogService';
import { SessionExpiredDialog } from './SessionExpiredDialog';

@injectable()
export class SessionExpireService {
  private isNotifiedAboutExpiredSession = false;

  onSessionExpire = new Subject();
  constructor(
    private graphQLService: GraphQLService,
    private commonDialogService: CommonDialogService
  ) {
  }

  subscribe() {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception) {
      if (exception instanceof GQLError
        && exception.errorCode === EServerErrorCode.sessionExpired
        && !this.isNotifiedAboutExpiredSession) {
        this.isNotifiedAboutExpiredSession = true;
        this.onSessionExpire.next();
        await this.commonDialogService.open(SessionExpiredDialog, null);
      }
      throw exception;
    }
  }
}
