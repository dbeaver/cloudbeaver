/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type React from 'react';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { DataViewerService } from './DataViewerService.js';

export function useDataViewerCopyHandler() {
  const notificationService = useService(NotificationService);
  const dataViewerService = useService(DataViewerService);

  return function (event?: ClipboardEvent | React.KeyboardEvent | React.ClipboardEvent) {
    if (!dataViewerService.canCopyData) {
      event?.preventDefault();

      notificationService.logInfo({
        title: 'data_viewer_copy_not_allowed',
        message: 'data_viewer_copy_not_allowed_message',
      });
    }

    return !dataViewerService.canCopyData;
  };
}
