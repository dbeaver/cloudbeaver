/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useTabLocalState } from '@cloudbeaver/core-ui';
import { CaptureViewScope } from '@cloudbeaver/core-view';
import { DataPresentationComponent, isResultSetDataModel, TableViewerLoader } from '@cloudbeaver/plugin-data-viewer';

import { DEFAULT_GROUPING_QUERY_OPERATION } from './DEFAULT_GROUPING_QUERY_OPERATION';
import styles from './DVResultSetGroupingPresentation.module.css';
import { DVResultSetGroupingPresentationContext } from './DVResultSetGroupingPresentationContext';
import type { IDVResultSetGroupingPresentationState } from './IDVResultSetGroupingPresentationState';
import { useGroupingDataModel } from './useGroupingDataModel';
import { useGroupingDnDColumns } from './useGroupingDnDColumns';

export const DVResultSetGroupingPresentation: DataPresentationComponent = observer(function DVResultSetGroupingPresentation({
  model: unknownModel,
  resultIndex,
}) {
  const originalModel = unknownModel as any;
  if (!isResultSetDataModel(originalModel)) {
    throw new Error('DVResultSetGroupingPresentation can only be used with ResultSetDataSource');
  }
  const state = useTabLocalState<IDVResultSetGroupingPresentationState>(() => ({
    presentationId: '',
    valuePresentationId: null,
    columns: [],
    functions: [DEFAULT_GROUPING_QUERY_OPERATION],
    showDuplicatesOnly: false,
  }));
  const style = useS(styles);

  const translate = useTranslate();
  const model = useGroupingDataModel(originalModel, resultIndex, state);
  const dnd = useGroupingDnDColumns(state, originalModel, model);

  return (
    <CaptureViewScope>
      <DVResultSetGroupingPresentationContext state={state} />
      <div
        ref={dnd.dndThrowBox.setRef}
        className={s(style, {
          throwBox: true,
          showDropOutside: dnd.dndThrowBox.state.canDrop,
          active: dnd.dndThrowBox.state.canDrop,
          over: dnd.dndThrowBox.state.isOver, // todo: this style doesn't exist
        })}
      />
      <div
        ref={dnd.dndBox.setRef}
        className={s(style, {
          dropArea: true,
          active: dnd.dndBox.state.canDrop,
          negative: dnd.dndThrowBox.state.isOver,
        })}
      >
        {state.columns.length === 0 ? (
          <div className={s(style, { placeholder: true })}>
            <div className={s(style, { message: true })}>{translate('plugin_data_viewer_result_set_grouping_placeholder')}</div>
          </div>
        ) : (
          <TableViewerLoader
            tableId={model.model.id}
            resultIndex={resultIndex}
            presentationId={state.presentationId}
            valuePresentationId={state.valuePresentationId}
            simple
            onPresentationChange={presentationId => {
              state.presentationId = presentationId;
            }}
            onValuePresentationChange={presentationId => {
              state.valuePresentationId = presentationId;
            }}
          />
        )}
      </div>
    </CaptureViewScope>
  );
});
