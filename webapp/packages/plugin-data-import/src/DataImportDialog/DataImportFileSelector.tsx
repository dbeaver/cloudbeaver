/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, InputFiles, s, Table, TableBody, TableColumnHeader, TableHeader, useS, useTranslate } from '@cloudbeaver/core-blocks';

import { DataImportFileItem } from './DataImportFileItem.js';
import classes from './DataImportFileSelector.module.css';
import type { IDataImportDialogState } from './IDataImportDialogState.js';

interface Props {
  state: IDataImportDialogState;
  onDelete: () => void;
}

export const DataImportFileSelector = observer<Props>(function DataImportFileSelector({ state, onDelete }) {
  const translate = useTranslate();
  const style = useS(classes);

  function handleFileSelect(value: FileList | null) {
    if (value) {
      state.file = value[0]!;
    }
  }

  const extension = state.selectedProcessor?.fileExtension ? `.${state.selectedProcessor.fileExtension}` : undefined;

  return (
    <Group box overflow>
      <Table>
        <TableHeader fixed>
          <TableColumnHeader className={s(style, { columnHeader: true })} heightBig>
            {translate('ui_name')}
          </TableColumnHeader>
          <TableColumnHeader className={s(style, { columnHeader: true })} heightBig flex>
            <Container zeroBasis />
            <InputFiles accept={extension} hideTags keepSize onChange={handleFileSelect} />
          </TableColumnHeader>
        </TableHeader>
        <TableBody>
          {state.file && <DataImportFileItem id={state.file.name} name={state.file.name} tooltip={state.file.name} onDelete={onDelete} />}
        </TableBody>
      </Table>
    </Group>
  );
});
