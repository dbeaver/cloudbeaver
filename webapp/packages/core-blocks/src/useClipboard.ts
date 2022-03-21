/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { copyToClipboard } from '@cloudbeaver/core-utils';

export function useClipboard() {
  const notificationService = useService(NotificationService);

  const copy = useCallback((value: string, notify = false) => {
    try {
      copyToClipboard(value);
      if (notify) {
        notificationService.notify({ title: 'ui_copy_to_clipboard_copied' }, ENotificationType.Success);
      }
    } catch (exception: any) {
      notificationService.logException(exception, 'ui_copy_to_clipboard_failed_to_copy');
    }
  }, [notificationService]);

  return copy;
}
