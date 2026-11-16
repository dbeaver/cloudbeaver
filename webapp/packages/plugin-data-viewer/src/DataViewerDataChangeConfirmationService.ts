/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { executorHandlerFilter, ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { IDatabaseDataEditAction } from './DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import type { IRequestEventData } from './DatabaseDataModel/IDatabaseDataModel.js';
import { DatabaseDataSourceOperation } from './DatabaseDataModel/IDatabaseDataSource.js';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';

export class DataViewerDataChangeConfirmationServiceImpl {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly tableViewerStorageService: TableViewerStorageService,
    private readonly notificationService: NotificationService,
  ) {
    this.checkUnsavedData = this.checkUnsavedData.bind(this);
  }

  // TODO: should be automatically called when the model is created, we can add executor to TableViewerStorageService for that
  trackTableDataUpdate(modelId: string) {
    const model = this.tableViewerStorageService.get(modelId);

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
          const editor = model.source.getAction(resultIndex, IDatabaseDataEditAction);

          if (editor?.isEdited() && !model.isDisabled(resultIndex)) {
            if (confirmationContext.confirmed) {
              await model.save();
            } else {
              const { status, result } = await this.commonDialogService.open(ConfirmationDialog, {
                title: 'data_viewer_result_edited_title',
                subTitle: model.name || undefined,
                message: 'data_viewer_result_edited_message',
                confirmActionText: 'ui_yes',
                showExtraAction: true,
              });

              if (status === DialogueStateResult.Resolved) {
                await model.save();
              } else {
                if (result?.isExtraAction) {
                  editor.clear();
                } else {
                  ExecutorInterrupter.interrupt(contexts);
                }
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

export type DataViewerDataChangeConfirmationService = DataViewerDataChangeConfirmationServiceImpl;

export class DataViewerDataChangeConfirmationServiceDI extends Context.Service<
  DataViewerDataChangeConfirmationServiceDI,
  DataViewerDataChangeConfirmationServiceImpl
>()('@cloudbeaver/plugin-data-viewer/DataViewerDataChangeConfirmationService#DataViewerDataChangeConfirmationService') {
  static readonly implementation = DataViewerDataChangeConfirmationServiceImpl;

  static readonly dependencies = () => [CommonDialogService, TableViewerStorageService, NotificationService] as const;
  static readonly make: Effect.Effect<
    DataViewerDataChangeConfirmationServiceImpl,
    never,
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof TableViewerStorageService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeDataViewerDataChangeConfirmationService() {
    const commonDialogService = yield* CommonDialogService;
    const tableViewerStorageService = yield* TableViewerStorageService;
    const notificationService = yield* NotificationService;

    return new DataViewerDataChangeConfirmationServiceImpl(commonDialogService, tableViewerStorageService, notificationService);
  });
  static readonly layer: Layer.Layer<
    DataViewerDataChangeConfirmationServiceDI,
    never,
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof TableViewerStorageService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerDataChangeConfirmationService = DataViewerDataChangeConfirmationServiceDI;

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
