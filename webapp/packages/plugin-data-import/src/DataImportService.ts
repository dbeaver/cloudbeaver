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
import { LocalizationService } from '@cloudbeaver/core-localization';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { getProgressPercent } from '@cloudbeaver/core-utils';

import { DataImportSettingsService } from './DataImportSettingsService';

@injectable()
export class DataImportService {
  get disabled() {
    return this.dataImportSettingsService.settings.getValue('disabled');
  }

  constructor(
    private readonly dataImportSettingsService: DataImportSettingsService,
    private readonly notificationService: NotificationService,
    private readonly localizationService: LocalizationService,
    private readonly graphQLService: GraphQLService,
  ) {
    makeObservable(this, {
      disabled: computed,
    });
  }

  async importData(connectionId: string, contextId: string, projectId: string, resultsId: string, files: FileList) {
    const fileNames = Array.from(files)
      .map(file => file.name)
      .join(',\n');

    const { controller, notification } = this.notificationService.processNotification(
      () => ProcessSnackbar,
      {},
      { title: this.localizationService.translate('plugin_data_import_process_title'), message: fileNames },
    );

    try {
      await this.graphQLService.sdk.uploadResultData(connectionId, contextId, projectId, resultsId, files, event => {
        if (event.total !== undefined) {
          const percentCompleted = getProgressPercent(event.loaded, event.total);

          if (notification.message) {
            controller.setMessage(`${percentCompleted}%\n${notification.message}`);
          }
        }
      });

      controller.resolve(this.localizationService.translate('plugin_data_import_process_success'));
    } catch (exception: any) {
      notification.close();
      throw exception;
    }
  }
}
