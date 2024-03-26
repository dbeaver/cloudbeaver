/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Container,
  Group,
  InputFiles,
  s,
  Table,
  TableBody,
  TableColumnHeader,
  TableHeader,
  useS,
  useTable,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { DataImportFileItem } from './DataImportFileItem';
import styles from './DataImportFileUploader.m.css';
import type { IDataImportDialogState } from './IDataImportDialogState';

interface Props {
  state: IDataImportDialogState;
  onDelete: (id: string) => void;
}

export const DataImportFileUploader = observer<Props>(function DataImportFileUploader({ state, onDelete }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);

  const style = useS(styles);
  const table = useTable();

  const fileList = Array.from(state.files ?? []);
  const keys = fileList.map(file => file.name);

  return (
    <Group className={s(style, { group: true })} box overflow>
      <Table className={s(style, { table: true })} keys={keys} selectedItems={table.selected}>
        <TableHeader fixed>
          <TableColumnHeader heightBig>{translate('administration_libraries_name_label')}</TableColumnHeader>
          <TableColumnHeader heightBig flex>
            <Container zeroBasis />
            <InputFiles
              name="files"
              state={state}
              aggregate
              multiple
              hideTags
              keepSize
              onDuplicate={files => {
                const fileNames = files.map(file => `"${file.name}"`);
                notificationService.logInfo({ title: 'ui_upload_files_duplicate_error', message: fileNames.join(', '), autoClose: false });
              }}
            />
          </TableColumnHeader>
        </TableHeader>
        <TableBody>
          {fileList.map(file => (
            <DataImportFileItem key={file.name} id={file.name} name={file.name} tooltip={file.name} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </Group>
  );
});
