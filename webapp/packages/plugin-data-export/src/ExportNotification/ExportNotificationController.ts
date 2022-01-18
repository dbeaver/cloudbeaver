/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { NavNodeManagerService } from '@cloudbeaver/core-app';
import { IInitializableController, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ENotificationType, INotification } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { ServerInternalError, ServerErrorType } from '@cloudbeaver/core-sdk';
import { Deferred, EDeferredState } from '@cloudbeaver/core-utils';

import { DataExportProcessService, ExportProcess } from '../DataExportProcessService';

interface ExportNotificationStatus {
  title: string;
  status: ENotificationType;
  message?: string;
}
@injectable()
export class ExportNotificationController implements IInitializableController {
  isDetailsDialogOpen = false;

  get isSuccess(): boolean {
    return this.process?.getState() === EDeferredState.RESOLVED;
  }

  get isPending(): boolean {
    return !!this.process?.isInProgress;
  }

  get process(): Deferred<string> | undefined {
    return this.task?.process;
  }

  get task(): ExportProcess | undefined {
    return this.dataExportProcessService.exportProcesses.get(this.notification.extraProps.source);
  }

  get hasDetails(): boolean {
    return !!this.process?.getRejectionReason();
  }

  get sourceName(): string {
    if (!this.task) {
      return '';
    }
    if (this.task.context.containerNodePath) {
      const node = this.navNodeManagerService.getNode(this.task.context.containerNodePath);

      return `${this.localization.translate('data_transfer_exporting_table')} ${node?.name}`;
    }

    return this.localization.translate('data_transfer_exporting_sql');
  }

  get status(): ExportNotificationStatus {
    switch (this.process?.getState()) {
      case EDeferredState.PENDING:
        return { title: 'data_transfer_notification_preparation', status: ENotificationType.Loading };
      case EDeferredState.CANCELLING:
        return { title: 'ui_processing_canceling', status: ENotificationType.Loading };
      case EDeferredState.RESOLVED:
        return { title: 'data_transfer_notification_ready', status: ENotificationType.Info };
      case EDeferredState.CANCELLED:
        return { title: 'data_transfer_notification_cancelled', status: ENotificationType.Info };
      default: {
        const error = this.process?.getRejectionReason();

        let title = 'data_transfer_notification_error';
        let status = ENotificationType.Error;
        let message = '';

        if (error instanceof ServerInternalError && error.errorType === ServerErrorType.QUOTE_EXCEEDED) {
          title = 'app_root_quota_exceeded';
          status = ENotificationType.Info;
          message = error.message;
        }

        return { title, status, message };
      }
    }
  }

  get downloadUrl(): string | undefined {
    return this.dataExportProcessService.downloadUrl(this.notification.extraProps.source);
  }

  private notification!: INotification<{ source: string }>;

  constructor(
    private commonDialogService: CommonDialogService,
    private dataExportProcessService: DataExportProcessService,
    private navNodeManagerService: NavNodeManagerService,
    private localization: LocalizationService
  ) {
    makeObservable(this, {
      isDetailsDialogOpen: observable,
      sourceName: computed,
    });
  }

  init(notification: INotification<{ source: string }>): void {
    this.notification = notification;
  }

  delete = (): void => {
    this.dataExportProcessService.delete(this.notification.extraProps.source);
    this.notification.close(false);
  };

  download = (): void => {
    this.dataExportProcessService.download(this.notification.extraProps.source);
    this.notification.close(false);
  };

  cancel = (): void => {
    this.dataExportProcessService.cancel(this.notification.extraProps.source);
  };

  showDetails = async (): Promise<void> => {
    this.isDetailsDialogOpen = true;
    try {
      this.notification.showDetails();
      await this.commonDialogService.open(ErrorDetailsDialog, this.process?.getRejectionReason());
    } finally {
      this.isDetailsDialogOpen = false;
    }
  };
}
