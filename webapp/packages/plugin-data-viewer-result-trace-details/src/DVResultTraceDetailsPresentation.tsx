/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';

import { s, TextPlaceholder, useAutoLoad, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DataGrid, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';
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

  const columnsCount = useCreateGridReactiveValue(() => 3, null, []);
  const rowCount = useCreateGridReactiveValue(
    () => trace?.length || 0,
    onValueChange => reaction(() => trace?.length || 0, onValueChange),
    [trace],
  );

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

  const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), [
    trace,
  ]);

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

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), []);

  if (!trace?.length) {
    return <TextPlaceholder>{translate('plugin_data_viewer_result_trace_no_data_placeholder')}</TextPlaceholder>;
  }

  return (
    <div className={s(styles, { container: true })}>
      <DataGrid cell={cell} columnCount={columnsCount} headerText={headerText} getRowHeight={() => 30} rowCount={rowCount} />
    </div>
  );
});
