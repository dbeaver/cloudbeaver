/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { NotificationService } from './NotificationService';

@injectable()
export class ExceptionsCatcherService extends Bootstrap {
  baseCatcher: OnErrorEventHandler | null = null;

  private readonly ignored: string[] = [];
  private readonly messageTitle = 'Uncatched exception';

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  register(): void {
    this.baseCatcher = window.onerror;
    window.onerror = this.catcher;
  }

  load(): void {}

  unsubscribe() {
    window.onerror = this.baseCatcher;
  }

  ignore(message: string) {
    this.ignored.push(message);
  }

  private readonly catcher = (
    event: Event | string,
    source?: string,
    lineno?: number,
    colno?: number,
    _error?: Error
  ) => {
    if (_error) {
      this.notificationService.logException(_error, this.messageTitle);
    } else {
      const message = String(event);
      this.notificationService.logError({
        title: this.messageTitle,
        message,
        isSilent: this.ignored.includes(message),
      });
    }

    if (this.baseCatcher) {
      return this.baseCatcher(event, source, lineno, colno, _error);
    }
    return true;
  };
}
