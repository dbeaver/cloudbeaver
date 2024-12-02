/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerErrorType, ServerInternalError } from '@cloudbeaver/core-sdk';
import { EDeferredState, errorOf } from '@cloudbeaver/core-utils';

import { DataExportProcessService } from '../DataExportProcessService.js';
import type { IExportNotification, IExportNotificationStatus } from './IExportNotification.js';

export function useExportNotification(notification: IExportNotification) {
  const dataExportProcessService = useService(DataExportProcessService);
  const localizationService = useService(LocalizationService);

  const state = useObservableRef(
    () => ({
      get task() {
        return this.dataExportProcessService.exportProcesses.get(this.notification.extraProps.source);
      },
      get resolved() {
        return this.task?.process.getState() === EDeferredState.RESOLVED;
      },
      get sourceName() {
        if (!this.task) {
          return '';
        }

        if (this.task.context.name) {
          return this.task.context.name;
        }

        return this.localizationService.translate('data_transfer_exporting_sql');
      },
      get downloadUrl() {
        return this.dataExportProcessService.downloadUrl(this.notification.extraProps.source);
      },
      get status(): IExportNotificationStatus {
        const process = this.task?.process;

        switch (process?.getState()) {
          case EDeferredState.PENDING:
            return { title: 'data_transfer_notification_preparation', status: ENotificationType.Loading };
          case EDeferredState.CANCELLING:
            return { title: 'ui_processing_canceling', status: ENotificationType.Loading };
          case EDeferredState.RESOLVED:
            return { title: 'data_transfer_notification_ready', status: ENotificationType.Info };
          case EDeferredState.CANCELLED:
            return { title: 'data_transfer_notification_cancelled', status: ENotificationType.Info };
          default: {
            const error = process?.getRejectionReason();
            const serverInternalError = errorOf(error, ServerInternalError);

            let title = 'data_transfer_notification_error';
            let status = ENotificationType.Error;
            let message = '';

            if (serverInternalError && serverInternalError.errorType === ServerErrorType.QUOTE_EXCEEDED) {
              title = 'app_root_quota_exceeded';
              status = ENotificationType.Info;
              message = serverInternalError.message;
            }

            return { title, status, message };
          }
        }
      },
      delete() {
        this.dataExportProcessService.delete(this.notification.extraProps.source);
        this.notification.close(false);
      },
      download() {
        this.dataExportProcessService.download(this.notification.extraProps.source);
        this.notification.close(false);
      },
      cancel() {
        this.dataExportProcessService.cancel(this.notification.extraProps.source);
      },
    }),
    {
      resolved: computed,
      task: computed,
      sourceName: computed,
      status: computed,
      delete: action.bound,
      download: action.bound,
      cancel: action.bound,
    },
    { notification, dataExportProcessService, localizationService },
  );

  return state;
}
