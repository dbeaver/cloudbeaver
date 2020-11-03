/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { GQLError } from '@cloudbeaver/core-sdk';

import { ENotificationType, IProcessNotificationState } from './INotification';
import { hasDetails } from './NotificationService';

export class ProcessNotificationController implements IProcessNotificationState {
  @observable error: Error | null;
  @observable title: string;
  @observable status: ENotificationType;
  @observable message?: string;

  constructor() {
    this.error = null;
    this.title = '';
    this.message = '';
    this.status = ENotificationType.Info;
  }

  init(title: string, message?: string) {
    this.status = ENotificationType.Loading;
    this.title = title;
    this.message = message;
  }

  resolve(title: string, message?: string) {
    this.status = ENotificationType.Success;
    this.title = title;
    this.message = message;
  }

  reject(e: Error | GQLError, title?: string, message?: string) {
    const exceptionMessage = hasDetails(e) ? e.errorText : e.message || e.name;

    this.status = ENotificationType.Error;
    this.title = title || e.name;
    this.message = message || exceptionMessage;
    this.error = e;
  }
}
