/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, TextPlaceholder, useAutoLoad, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DynamicTraceProperty } from '@cloudbeaver/core-sdk';
import type { DataPresentationComponent, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';
import DataGrid, { Column } from '@cloudbeaver/plugin-react-data-grid';

import { HeaderCell } from './ResultTraceDetailsTable/HeaderCell';
import { RESULT_TRACE_DETAILS_TABLE_THEME_BASE_STYLES } from './styles/styles';
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
    const state = useResultTraceDetails(model, resultIndex);

    useS(RESULT_TRACE_DETAILS_TABLE_THEME_BASE_STYLES);
    useAutoLoad(DVResultTraceDetailsPresentation, state, undefined, undefined, true);

    if (!state.trace?.length) {
      return <TextPlaceholder>{translate('plugin_data_viewer_result_trace_no_data_placeholder')}</TextPlaceholder>;
    }

    return (
      <Container className="result-trace-details-grid-container">
        <DataGrid className="result-trace-details-grid-theme" rows={state.trace} rowKeyGetter={row => row.name} columns={COLUMNS} rowHeight={30} />
      </Container>
    );
  },
);
