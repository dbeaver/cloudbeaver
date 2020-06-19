/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { NotificationService } from './NotificationService';

@injectable()
export class ExceptionsCatcherService {
  baseCatcher: OnErrorEventHandler | null = null;

  constructor(private notificationService: NotificationService) { }

  subscribe() {
    this.baseCatcher = window.onerror;
    window.onerror = this.catcher;
  }

  unsubscribe() {
    window.onerror = this.baseCatcher;
  }

  private catcher = (
    event: Event | string,
    source?: string,
    lineno?: number,
    colno?: number,
    _error?: Error
  ) => {
    if (_error) {
      this.notificationService.logException(_error, 'Uncatched exception');
    } else {
      this.notificationService.logError({ title: event as string });
    }

    if (this.baseCatcher) {
      return this.baseCatcher(event, source, lineno, colno, _error);
    }
    return true;
  }
}
