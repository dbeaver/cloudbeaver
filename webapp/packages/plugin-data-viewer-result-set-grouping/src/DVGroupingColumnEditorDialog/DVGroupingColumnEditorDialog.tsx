/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Group,
  s,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';

import type { IResultSetGroupingData } from '../DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING.js';
import styles from './DVGroupingColumnEditorDialog.module.css';
import { GroupingColumnEditorTable } from './GroupingColumnEditorTable.js';

interface Payload {
  grouping: IResultSetGroupingData;
}

export const DVGroupingColumnEditorDialog = observer<DialogComponentProps<Payload>>(function DVGroupingColumnEditorDialog({
  rejectDialog,
  resolveDialog,
  payload,
}) {
  const { grouping } = payload;
  const translate = useTranslate();
  const style = useS(styles);

  const [columns, setColumns] = useState([...grouping.getColumns()]);
  const [functions, setFunctions] = useState([...grouping.getFunctions()]);

  function addColumnHandler(name: string) {
    setColumns([...columns, name]);
  }

  function addFunctionHandler(name: string) {
    setFunctions([...functions, name]);
  }

  function deleteColumnHandler(name: string) {
    setColumns(columns.filter(column => column !== name));
  }

  function deleteFunctionHandler(name: string) {
    setFunctions(functions.filter(column => column !== name));
  }

  async function submit() {
    grouping.setColumns(columns);
    grouping.setFunctions(functions);
    resolveDialog();
  }

  return (
    <CommonDialogWrapper size="medium">
      <CommonDialogHeader
        title={translate('plugin_data_viewer_result_set_grouping_grouping_configuration')}
        icon="/icons/settings.svg"
        onReject={rejectDialog}
      />
      <CommonDialogBody>
        <Container>
          <Group box medium gap>
            <GroupingColumnEditorTable
              title={translate('plugin_data_viewer_result_set_grouping_grouping_columns')}
              placeholder={translate('plugin_data_viewer_result_set_grouping_grouping_columns_placeholder')}
              columns={columns}
              onAdd={addColumnHandler}
              onDelete={deleteColumnHandler}
            />
            <GroupingColumnEditorTable
              title={translate('plugin_data_viewer_result_set_grouping_grouping_functions')}
              placeholder={translate('plugin_data_viewer_result_set_grouping_grouping_functions_placeholder')}
              columns={functions}
              onAdd={addFunctionHandler}
              onDelete={deleteFunctionHandler}
            />
          </Group>
        </Container>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(style, { footerContainer: true })}>
          <Button variant="secondary" onClick={rejectDialog}>
            {translate('ui_close')}
          </Button>
          <Button onClick={submit}>{translate('ui_apply')}</Button>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
