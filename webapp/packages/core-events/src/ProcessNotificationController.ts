/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { DetailsError, GQLError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

import { ENotificationType, type IProcessNotificationState } from './INotification.js';

export class ProcessNotificationController implements IProcessNotificationState {
  error: Error | null;
  title: string;
  status: ENotificationType;
  message: string | null;

  constructor() {
    this.error = null;
    this.title = '';
    this.message = null;
    this.status = ENotificationType.Info;

    makeObservable(this, {
      error: observable,
      title: observable,
      status: observable,
      message: observable.ref,
    });
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
    const errorDetails = errorOf(error, DetailsError);

    this.status = ENotificationType.Error;
    this.title = title || errorDetails?.name || error.name;
    this.message = message || errorDetails?.message || error.message;
    this.error = error;
  }

  setMessage(message: string | null) {
    this.message = message;
  }
}
