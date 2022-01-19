/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { getErrorDetails, GQLError } from '@cloudbeaver/core-sdk';

import { ENotificationType, IProcessNotificationState } from './INotification';

export class ProcessNotificationController implements IProcessNotificationState {
  error: Error | null;
  title: string;
  status: ENotificationType;
  message: string | null;

  constructor() {
    makeObservable(this, {
      error: observable,
      title: observable,
      status: observable,
      message: observable,
    });

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
