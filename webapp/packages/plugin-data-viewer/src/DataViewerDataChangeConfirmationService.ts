/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { DatabaseEditAction } from './DatabaseDataModel/Actions/DatabaseEditAction';
import type { IRequestEventData } from './DatabaseDataModel/IDatabaseDataModel';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

@injectable()
export class DataViewerDataChangeConfirmationService {
  constructor(
    private commonDialogService: CommonDialogService,
    private dataViewerTableService: TableViewerStorageService,
    private notificationService: NotificationService
  ) {
    this.checkUnsavedData = this.checkUnsavedData.bind(this);
  }

  trackTableDataUpdate(modelId: string) {
    const model = this.dataViewerTableService.get(modelId);

    if (model && !model.onRequest.addHandler(this.checkUnsavedData)) {
      model.onRequest.addHandler(this.checkUnsavedData);
    }
  }

  private async checkUnsavedData({
    type,
    model,
  }: IRequestEventData<any, any>,
  contexts: IExecutionContextProvider<IRequestEventData<any, any>>
  ) {
    if (type === 'before') {
      const confirmationContext = contexts.getContext(SaveConfirmedContext);

      if (confirmationContext.confirmed === false) {
        return;
      }

      const results = model.getResults();

      try {
        for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
          const editor = model.source.getActionImplementation(
            resultIndex,
            DatabaseEditAction
          );

          if (editor?.isEdited() && model.source.executionContext?.context) {
            if (confirmationContext.confirmed) {
              await model.save();
            } else {
              const result = await this.commonDialogService.open(ConfirmationDialog, {
                title: 'data_viewer_result_edited_title',
                subTitle: model.name || undefined,
                message: 'data_viewer_result_edited_message',
                confirmActionText: 'ui_yes',
                extraStatus: 'no',
              });

              if (result === DialogueStateResult.Rejected) {
                ExecutorInterrupter.interrupt(contexts);
              } else if (result === DialogueStateResult.Resolved) {
                await model.save();
              } else {
                editor.clear();
              }
            }
          }
        }
      } catch (exception: any) {
        ExecutorInterrupter.interrupt(contexts);
        this.notificationService.logException(exception, 'data_viewer_data_save_error_title');
      }
    }
  }
}

interface ISaveConfirmedContext{
  confirmed: boolean | null;
  setConfirmed: (state: boolean) => void;
}

function SaveConfirmedContext(): ISaveConfirmedContext {
  let confirmed = null as boolean | null;

  return {
    get confirmed() {
      return confirmed;
    },
    setConfirmed(state) {
      confirmed = state;
    },
  };
}
