/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { copyToClipboard } from '@cloudbeaver/core-utils';

@injectable()
export class ClipboardService {
  private readPermission: PermissionStatus | null;
  private permissionUpdate: number;
  clipboardAvailable: boolean;
  clipboardValue: string | null;

  get state(): PermissionState {
    if (this.permissionUpdate > 0 && this.readPermission) {
      return this.readPermission.state;
    }

    return 'prompt';
  }

  constructor(
    private readonly notificationService: NotificationService
  ) {
    makeObservable<ClipboardService, 'permissionUpdate'>(this, {
      clipboardValue: observable,
      permissionUpdate: observable,
    });
    this.permissionUpdate = 1;
    this.readPermission = null;
    this.clipboardValue = null;
    this.clipboardAvailable = false;
  }

  async read(): Promise<string | null> {
    if (!this.clipboardAvailable || this.state === 'denied') {
      return null;
    }

    try {
      const value = await navigator.clipboard.readText();
      this.clipboardValue = value;
    } catch (exception: any) {
      this.clipboardAvailable = false;
      this.clipboardValue = null;
      this.notificationService.logException(exception, 'Failed to read from clipboard', '', true);
      this.notificationService.logInfo({ title: 'ui_clipboard_access_denied_title', message: 'ui_clipboard_access_denied_message' });
    }

    return this.clipboardValue;
  }

  write(value: string, notify: boolean): void {
    try {
      copyToClipboard(value);
      if (notify) {
        this.notificationService.notify({ title: 'ui_copy_to_clipboard_copied' }, ENotificationType.Info);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'ui_copy_to_clipboard_failed_to_copy');
    }
  }

  async tryActivateClipboard(): Promise<void> {
    if (!navigator.clipboard) {
      this.clipboardAvailable = false;
      return;
    }

    this.clipboardAvailable = true;
    await this.updatePermissionStatus();
    if (this.readPermission) {
      this.readPermission.addEventListener('change', () => {
        this.permissionUpdate++;
      });
    }
  }

  async updatePermissionStatus(): Promise<void> {
    try {
      this.readPermission = await navigator.permissions.query({ name: 'clipboard-read' as any });
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Failed to get permission status', '', true);
      this.readPermission = null;
    }
  }
}
