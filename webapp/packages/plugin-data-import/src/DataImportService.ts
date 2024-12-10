/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { ProcessSnackbar } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService, EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { getProgressPercent } from '@cloudbeaver/core-utils';

import { DataImportSettingsService } from './DataImportSettingsService.js';

@injectable()
export class DataImportService {
  get disabled() {
    if (this.sessionPermissionsResource.has(EAdminPermission.admin)) {
      return false;
    }

    return this.dataImportSettingsService.disabled;
  }

  constructor(
    private readonly dataImportSettingsService: DataImportSettingsService,
    private readonly notificationService: NotificationService,
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {
    makeObservable(this, {
      disabled: computed,
    });
  }

  async importData(connectionId: string, contextId: string, projectId: string, resultsId: string, processorId: string, file: File) {
    const abortController = new AbortController();
    let cancelImplementation: (() => void | Promise<void>) | null;
    let isCancelled = false;

    function cancel() {
      if (!cancelImplementation) {
        return;
      }

      cancelImplementation();
      isCancelled = true;
    }

    const { controller, notification } = this.notificationService.processNotification(
      () => ProcessSnackbar,
      {
        onCancel: cancel,
      },
      { title: 'plugin_data_import_process_title', message: file.name, onClose: cancel },
    );

    try {
      cancelImplementation = () => abortController.abort();

      const result = await this.graphQLService.sdk.uploadResultData(
        connectionId,
        contextId,
        projectId,
        resultsId,
        processorId,
        file,
        event => {
          if (isCancelled) {
            return;
          }

          if (event.total !== undefined) {
            const percentCompleted = getProgressPercent(event.loaded, event.total);

            if (notification.message) {
              controller.setMessage(`${percentCompleted}%\n${notification.message}`);
            }
          }
        },
        abortController.signal,
      );

      const task = this.asyncTaskInfoService.create(async () => {
        const { taskInfo } = await this.graphQLService.sdk.getAsyncTaskInfo({ taskId: result.id, removeOnFinish: false });
        return taskInfo;
      });

      cancelImplementation = () => this.asyncTaskInfoService.cancel(task.id);
      controller.setMessage('plugin_data_import_process_file_processing_step_message');
      await this.asyncTaskInfoService.run(task);

      controller.resolve('plugin_data_import_process_success');
      return true;
    } catch (exception: any) {
      controller.reject(exception, 'plugin_data_import_process_fail');
      return false;
    } finally {
      cancelImplementation = null;
    }
  }
}
