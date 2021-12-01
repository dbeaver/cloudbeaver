/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TextPlaceholder, useExecutor } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseEditAction } from '../DatabaseDataModel/Actions/DatabaseEditAction';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDataPresentationOptions } from '../DataPresentationService';
import type { IDataTableActions } from './IDataTableActions';
import { TableStatistics } from './TableStatistics';

interface Props {
  model: IDatabaseDataModel<any>;
  actions: IDataTableActions;
  dataFormat: ResultDataFormat;
  presentation: IDataPresentationOptions;
  resultIndex: number;
}

const styles = css`
  Presentation {
    flex: 1;
    overflow: auto;
  }
`;

export const TableGrid = observer<Props>(function TableGrid({
  model,
  actions,
  dataFormat,
  presentation,
  resultIndex,
}) {
  const commonDialogService = useService(CommonDialogService);

  useExecutor({
    executor: model.onRequest,
    handlers: [async function checkUnsavedData(data, contexts) {
      if (data.type === 'before') {
        const editor = model.source.getActionImplementation(
          resultIndex,
          DatabaseEditAction
        );

        if (editor?.isEdited()) {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'data_viewer_result_edited_title',
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
    }],
  });

  if (
    (presentation.dataFormat !== undefined && dataFormat !== presentation.dataFormat)
    || !model.source.hasResult(resultIndex)
  ) {
    if (model.isLoading()) {
      return null;
    }

    // eslint-disable-next-line react/no-unescaped-entities
    return <TextPlaceholder>Current data can't be displayed by selected presentation</TextPlaceholder>;
  }

  const result = model.getResult(resultIndex);

  const Presentation = presentation.getPresentationComponent();

  if (result?.loadedFully && !result.data) {
    return <TableStatistics model={model} resultIndex={resultIndex} />;
  }

  return styled(styles)(
    <Presentation dataFormat={dataFormat} model={model} actions={actions} resultIndex={resultIndex} />
  );
});
