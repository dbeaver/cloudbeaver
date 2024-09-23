/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { executorHandlerFilter, ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { DatabaseEditAction } from './DatabaseDataModel/Actions/DatabaseEditAction.js';
import type { IRequestEventData } from './DatabaseDataModel/IDatabaseDataModel.js';
import { DatabaseDataSourceOperation } from './DatabaseDataModel/IDatabaseDataSource.js';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';

@injectable()
export class DataViewerDataChangeConfirmationService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly dataViewerTableService: TableViewerStorageService,
    private readonly notificationService: NotificationService,
  ) {
    this.checkUnsavedData = this.checkUnsavedData.bind(this);
  }

  // TODO: should be automatically called when the model is created, we can add executor to TableViewerStorageService for that
  trackTableDataUpdate(modelId: string) {
    const model = this.dataViewerTableService.get(modelId);

    if (model && !model.onRequest.hasHandler(this.checkUnsavedData)) {
      model.onRequest.addHandler(executorHandlerFilter(({ operation }) => operation === DatabaseDataSourceOperation.Request, this.checkUnsavedData));
    }
  }

  private async checkUnsavedData({ stage, model }: IRequestEventData, contexts: IExecutionContextProvider<IRequestEventData>) {
    if (stage === 'request') {
      const confirmationContext = contexts.getContext(SaveConfirmedContext);

      if (confirmationContext.confirmed === false) {
        return;
      }

      const results = model.source.getResults();

      try {
        for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
          const editor = model.source.getActionImplementation(resultIndex, DatabaseEditAction);

          if (editor?.isEdited() && !model.isDisabled(resultIndex)) {
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
        this.notificationService.logException(exception, 'data_viewer_data_save_error_title');
        throw exception;
      }
    }
  }
}

interface ISaveConfirmedContext {
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
