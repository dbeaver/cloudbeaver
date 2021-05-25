/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';

import { copyToClipboard } from './copyToClipboard';

@injectable()
export class ClipboardService {
  clipboardAvailable: boolean;
  clipboardValue: string | null;
  state: PermissionState | null;

  constructor(
    private notificationService: NotificationService
  ) {
    makeObservable(this, {
      clipboardValue: observable,
      state: observable,
    });
    this.clipboardValue = null;
    this.state = null;
    this.clipboardAvailable = false;
  }

  async read(): Promise<string | null> {
    if (!this.clipboardAvailable) {
      return null;
    }

    try {
      const value = await navigator.clipboard.readText();
      this.state = 'granted';
      this.clipboardValue = value;
    } catch (exeption) {
      console.error(exeption);
      this.state = 'denied';
      this.clipboardValue = null;
      this.notificationService.logInfo({ title: 'ui_clipboard_access_denied_title', message: 'ui_clipboard_access_denied_message' });
    }

    return this.clipboardValue;
  }

  write(value: string, notify: boolean): void {
    try {
      copyToClipboard(value);
      if (notify) {
        this.notificationService.notify({ title: 'ui_copy_to_clipboard_copied' }, ENotificationType.Success);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'ui_copy_to_clipboard_failed_to_copy');
    }
  }
}
