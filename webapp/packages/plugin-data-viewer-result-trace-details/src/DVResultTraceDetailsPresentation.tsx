/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, TextPlaceholder, useAutoLoad, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DynamicTraceProperty } from '@cloudbeaver/core-sdk';
import { type Column, DataGrid } from '@cloudbeaver/plugin-data-grid';
import type { DataPresentationComponent, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

import classes from './DVResultTraceDetailsPresentation.module.css';
import { HeaderCell } from './ResultTraceDetailsTable/HeaderCell';
import { useResultTraceDetails } from './useResultTraceDetails';

const COLUMNS: Column<DynamicTraceProperty>[] = [
  {
    key: 'name',
    name: 'ui_name',
    resizable: true,
    renderCell: props => <div>{props.row.name}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'value',
    name: 'ui_value',
    resizable: true,
    renderCell: props => <div>{props.row.value ?? ''}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'description',
    name: 'ui_description',
    resizable: true,
    renderCell: props => <div>{props.row.description ?? ''}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
];

export const DVResultTraceDetailsPresentation: DataPresentationComponent<any, IDatabaseResultSet> = observer(
  function DVResultTraceDetailsPresentation({ model, resultIndex }) {
    const translate = useTranslate();
    const styles = useS(classes);
    const state = useResultTraceDetails(model, resultIndex);

    useAutoLoad(DVResultTraceDetailsPresentation, state, undefined, undefined, true);

    if (!state.trace?.length) {
      return <TextPlaceholder>{translate('plugin_data_viewer_result_trace_no_data_placeholder')}</TextPlaceholder>;
    }

    return (
      <div className={s(styles, { container: true })}>
        <DataGrid rows={state.trace} rowKeyGetter={row => row.name} columns={COLUMNS} rowHeight={30} />
      </div>
    );
  },
);
