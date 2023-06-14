/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { useObservableRef, useTranslate } from '@cloudbeaver/core-blocks';
import { useTabLocalState } from '@cloudbeaver/core-ui';
import { CaptureViewContext, useDataContext } from '@cloudbeaver/core-view';
import { DataPresentationComponent, IDatabaseResultSet, TableViewerLoader } from '@cloudbeaver/plugin-data-viewer';

import { DATA_CONTEXT_DV_DDM_RS_GROUPING, IResultSetGroupingData } from './DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING';
import type { IGroupingQueryState } from './IGroupingQueryState';
import { useGroupingDataModel } from './useGroupingDataModel';
import { useGroupingDnDColumns } from './useGroupingDnDColumns';

const styles = css`
  drop-area {
    composes: theme-background-secondary theme-text-on-secondary from global;
    flex: 1;
    display: flex;
    position: relative;
    overflow: auto;

    &[|active]::after,
    &[|negative]::after {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: dashed 2px;
      border-color: transparent;
      border-radius: var(--theme-group-element-radius);
    }

    &[|active]::after {
      content: '';
      border-color: var(--theme-primary) !important;
    }

    &[|negative]::after {
      content: '';
      border-color: var(--theme-negative) !important;
    }

    & placeholder {
      display: flex;
      height: 100%;
      width: 100%;

      & message {
        box-sizing: border-box;
        padding: 16px;
        margin: auto;
        text-align: center;
        white-space: pre-wrap;
      }
    }
  }
  throw-box {
    position: fixed;

    &:not([|showDropOutside]) {
      left: 0;
      top: 0;
      height: 0;
      width: 0;
    }

    &[|showDropOutside] {
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }
  }
  throw-box[|showDropOutside] + drop-area {
    z-index: 1000;
  }
`;

interface IPrivateGroupingData extends IResultSetGroupingData {
  state: IDVResultSetGroupingPresentationState;
}

interface IDVResultSetGroupingPresentationState extends IGroupingQueryState {
  presentationId: string;
}

export const DVResultSetGroupingPresentation: DataPresentationComponent<any, IDatabaseResultSet> = observer(function DVResultSetGroupingPresentation({
  model: originalModel,
  resultIndex,
}) {
  const state = useTabLocalState<IDVResultSetGroupingPresentationState>(() => ({
    presentationId: '',
    columns: [],
  }));

  const viewContext = useContext(CaptureViewContext);
  const context = useDataContext(viewContext);
  const translate = useTranslate();
  const [presentationId, setPresentation] = useState('');
  const [valuePresentationId, setValuePresentation] = useState<string | null>(null);
  const model = useGroupingDataModel(originalModel, resultIndex, state);
  const dnd = useGroupingDnDColumns(state, originalModel, model);

  const groupingData = useObservableRef<IPrivateGroupingData>(
    () => ({
      getColumns() {
        return this.state.columns;
      },
      removeColumn(...columns) {
        this.state.columns = this.state.columns.filter(column => !columns.includes(column));
      },
      clear() {
        this.state.presentationId = '';
        this.state.columns = [];
      },
    }),
    {
      clear: action,
    },
    { state },
  );

  context.set(DATA_CONTEXT_DV_DDM_RS_GROUPING, groupingData);

  return styled(styles)(
    <>
      <throw-box
        ref={dnd.dndThrowBox.setRef}
        {...use({
          showDropOutside: dnd.dndThrowBox.state.canDrop,
          active: dnd.dndThrowBox.state.canDrop,
          over: dnd.dndThrowBox.state.isOver,
        })}
      />
      <drop-area
        ref={dnd.dndBox.setRef}
        {...use({
          active: dnd.dndBox.state.canDrop,
          negative: dnd.dndThrowBox.state.isOver,
        })}
      >
        {state.columns.length === 0 ? (
          <placeholder>
            <message>{translate('plugin_data_viewer_result_set_grouping_placeholder')}</message>
          </placeholder>
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
      </drop-area>
    </>,
  );
});
