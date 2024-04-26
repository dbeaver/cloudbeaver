/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useDataContext } from '@cloudbeaver/core-data-context';
import { useTabLocalState } from '@cloudbeaver/core-ui';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import { DataPresentationComponent, IDatabaseResultSet, TableViewerLoader } from '@cloudbeaver/plugin-data-viewer';

import { DATA_CONTEXT_DV_DDM_RS_GROUPING } from './DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING';
import { DEFAULT_GROUPING_QUERY_OPERATION } from './DEFAULT_GROUPING_QUERY_OPERATION';
import styles from './DVResultSetGroupingPresentation.m.css';
import type { IGroupingQueryState } from './IGroupingQueryState';
import { useGroupingData } from './useGroupingData';
import { useGroupingDataModel } from './useGroupingDataModel';
import { useGroupingDnDColumns } from './useGroupingDnDColumns';

export interface IDVResultSetGroupingPresentationState extends IGroupingQueryState {
  presentationId: string;
}

export const DVResultSetGroupingPresentation: DataPresentationComponent<any, IDatabaseResultSet> = observer(function DVResultSetGroupingPresentation({
  model: originalModel,
  resultIndex,
}) {
  const state = useTabLocalState<IDVResultSetGroupingPresentationState>(() => ({
    presentationId: '',
    columns: [],
    functions: [DEFAULT_GROUPING_QUERY_OPERATION],
    showDuplicatesOnly: false,
  }));
  const style = useS(styles);

  const viewContext = useContext(CaptureViewContext);
  const context = useDataContext(viewContext);
  const translate = useTranslate();
  const [presentationId, setPresentation] = useState('');
  const [valuePresentationId, setValuePresentation] = useState<string | null>(null);
  const model = useGroupingDataModel(originalModel, resultIndex, state);
  const dnd = useGroupingDnDColumns(state, originalModel, model);

  const grouping = useGroupingData(state);

  context.set(DATA_CONTEXT_DV_DDM_RS_GROUPING, grouping);

  return (
    <>
      <div
        ref={dnd.dndThrowBox.setRef}
        className={s(style, {
          throwBox: true,
          showDropOutside: dnd.dndThrowBox.state.canDrop,
          active: dnd.dndThrowBox.state.canDrop,
          over: dnd.dndThrowBox.state.isOver,
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
            presentationId={presentationId}
            valuePresentationId={valuePresentationId}
            context={context}
            simple
            onPresentationChange={setPresentation}
            onValuePresentationChange={setValuePresentation}
          />
        )}
      </div>
    </>
  );
});
