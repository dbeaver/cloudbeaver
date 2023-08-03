/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2023 DBeaver Corp
 *
 * All Rights Reserved
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, Group, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';

import type { IResultSetGroupingData } from '../DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING';
import styles from './DVGroupingColumnEditorDialog.m.css';
import { GroupingColumnEditorTable } from './GroupingColumnEditorTable';

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

  const onAddColumn = (name: string) => {
    if (!name) {
      return;
    }
    setColumns([...columns, name]);
  };

  const onAddFunction = (name: string) => {
    if (!name) {
      return;
    }
    setFunctions([...functions, name]);
  };

  const onDeleteColumn = (name: string) => {
    setColumns(columns.filter(column => column !== name));
  };

  const onDeleteFunction = (name: string) => {
    setFunctions(functions.filter(column => column !== name));
  };

  const onColumnChange = (name: string, index: number) => {
    const newColumns = [...columns];
    newColumns[index] = name;
    setColumns(newColumns);
  };

  const onFunctionChange = (name: string, index: number) => {
    const newFunctions = [...functions];
    newFunctions[index] = name;
    setFunctions(newFunctions);
  };

  async function submit() {
    grouping.setColumns(columns);
    grouping.setFunctions(functions);
    resolveDialog();
  }

  return (
    <CommonDialogWrapper size="medium">
      <CommonDialogHeader
        title={translate('plugin-data-viewer-result-set-grouping_grouping_configuration')}
        icon="/icons/plugin_data_viewer_result_set_grouping_add_column.svg"
        onReject={rejectDialog}
      />
      <CommonDialogBody noBodyPadding>
        <Group box>
          <div className={s(style, { tablesContainer: true })}>
            <GroupingColumnEditorTable
              title={translate('plugin-data-viewer-result-set-grouping_grouping_columns')}
              columns={columns}
              onAdd={onAddColumn}
              onDelete={onDeleteColumn}
              onColumnChange={onColumnChange}
            />
            <GroupingColumnEditorTable
              title={translate('plugin-data-viewer-result-set-grouping_grouping_functions')}
              columns={functions}
              onAdd={onAddFunction}
              onDelete={onDeleteFunction}
              onColumnChange={onFunctionChange}
            />
          </div>
        </Group>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(style, { footerContainer: true })}>
          <Button mod={['outlined']} onClick={rejectDialog}>
            {translate('ui_close')}
          </Button>
          <Button mod={['unelevated']} onClick={submit}>
            {translate('ui_apply')}
          </Button>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
