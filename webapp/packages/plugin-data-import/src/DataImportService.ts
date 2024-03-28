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
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { getProgressPercent } from '@cloudbeaver/core-utils';

import { DataImportSettingsService } from './DataImportSettingsService';

@injectable()
export class DataImportService {
  get disabled() {
    return this.dataImportSettingsService.settings.getValue('plugin.data-import.disabled');
  }

  constructor(
    private readonly dataImportSettingsService: DataImportSettingsService,
    private readonly notificationService: NotificationService,
    private readonly graphQLService: GraphQLService,
  ) {
    makeObservable(this, {
      disabled: computed,
    });
  }

  async importData(connectionId: string, contextId: string, projectId: string, resultsId: string, processorId: string, file: File) {
    const { controller, notification } = this.notificationService.processNotification(
      () => ProcessSnackbar,
      {},
      { title: 'plugin_data_import_process_title', message: file.name },
    );

    try {
      await this.graphQLService.sdk.uploadResultData(connectionId, contextId, projectId, resultsId, processorId, file, event => {
        if (event.total !== undefined) {
          const percentCompleted = getProgressPercent(event.loaded, event.total);

          if (notification.message) {
            controller.setMessage(`${percentCompleted}%\n${notification.message}`);
          }
        }
      });

      controller.resolve('plugin_data_import_process_success');
      return true;
    } catch (exception: any) {
      controller.reject(exception, 'plugin_data_import_process_fail');
      return false;
    }
  }
}
