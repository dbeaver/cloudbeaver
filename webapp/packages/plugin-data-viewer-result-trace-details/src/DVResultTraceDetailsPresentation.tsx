/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, TextPlaceholder, useAutoLoad, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DataGrid } from '@cloudbeaver/plugin-data-grid';
import { type DataPresentationComponent, type IDatabaseDataOptions, isResultSetDataModel } from '@cloudbeaver/plugin-data-viewer';

import classes from './DVResultTraceDetailsPresentation.module.css';
import { useResultTraceDetails } from './useResultTraceDetails.js';

export const DVResultTraceDetailsPresentation: DataPresentationComponent = observer(function DVResultTraceDetailsPresentation({
  model,
  resultIndex,
}) {
  if (!isResultSetDataModel<IDatabaseDataOptions>(model)) {
    throw new Error('DVResultTraceDetailsPresentation can only be used with ResultSetDataSource');
  }
  const translate = useTranslate();
  const styles = useS(classes);
  const state = useResultTraceDetails(model, resultIndex);

  useAutoLoad(DVResultTraceDetailsPresentation, state, undefined, undefined, true);
  const trace = state.trace;

  if (!trace?.length) {
    return <TextPlaceholder>{translate('plugin_data_viewer_result_trace_no_data_placeholder')}</TextPlaceholder>;
  }

  function getCell(rowIdx: number, colIdx: number) {
    switch (colIdx) {
      case 0:
        return trace![rowIdx]?.name ?? '';
      case 1:
        return trace![rowIdx]?.value ?? '';
      case 2:
        return trace![rowIdx]?.description ?? '';
    }

    return '';
  }

  function getHeaderText(colIdx: number) {
    switch (colIdx) {
      case 0:
        return translate('ui_name');
      case 1:
        return translate('ui_value');
      case 2:
        return translate('ui_description');
    }

    return '';
  }

  return (
    <div className={s(styles, { container: true })}>
      <DataGrid getCell={getCell} getColumnCount={() => 3} getHeaderText={getHeaderText} getRowHeight={() => 30} getRowCount={() => trace.length} />
    </div>
  );
});
