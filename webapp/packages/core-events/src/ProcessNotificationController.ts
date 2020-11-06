/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { getErrorDetails, GQLError } from '@cloudbeaver/core-sdk';

import { ENotificationType, IProcessNotificationState } from './INotification';

export class ProcessNotificationController implements IProcessNotificationState {
  @observable error: Error | null;
  @observable title: string;
  @observable status: ENotificationType;
  @observable message: string | null;

  constructor() {
    this.error = null;
    this.title = '';
    this.message = null;
    this.status = ENotificationType.Info;
  }

  init(title: string, message: string | null = null) {
    this.status = ENotificationType.Loading;
    this.title = title;
    this.message = message;
  }

  resolve(title: string, message: string | null = null) {
    this.status = ENotificationType.Success;
    this.title = title;
    this.message = message;
  }

  reject(error: Error | GQLError, title?: string, message: string | null = null) {
    const errorDetails = getErrorDetails(error);

    this.status = ENotificationType.Error;
    this.title = title || errorDetails.name;
    this.message = message || errorDetails.message;
    this.error = error;
  }
}
