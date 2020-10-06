/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject } from 'rxjs';

import { ActionSnackbar } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import {
  GQLError, GraphQLService, EServerErrorCode
} from '@cloudbeaver/core-sdk';

import { SessionExpiredDialog } from './SessionExpiredDialog';

@injectable()
export class SessionExpireService {
  private isNotifiedAboutExpiredSession = false;

  onSessionExpire = new Subject();
  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService
  ) {
  }

  subscribe(): void {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    if(this.isNotifiedAboutExpiredSession) {
      const e = new Error('Session expired');
      e.name = 'SessionError';
      throw e;
    }
    try {
      return await request;
    } catch (exception) {
      if (exception instanceof GQLError &&
        exception.errorCode === EServerErrorCode.sessionExpired &&
        !this.isNotifiedAboutExpiredSession) {
        this.isNotifiedAboutExpiredSession = true;
        this.onSessionExpire.next();
        try {
          await this.commonDialogService.open(SessionExpiredDialog, null);
        } finally {
          this.notificationService.customNotification(() => ActionSnackbar, {
            actionText: 'app_root_session_expired_reload',
            onAction: () => location.reload(),
          }, { title: 'app_root_session_expired_title', persistent: true, type: ENotificationType.Error });
        }
      }
      throw exception;
    }
  }
}
