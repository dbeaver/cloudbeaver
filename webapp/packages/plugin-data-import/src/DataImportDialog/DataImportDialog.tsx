/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Fill,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import { DataImportFileUploader } from './DataImportFileUploader';
import { EDataImportDialogStep } from './EDataImportDialogStep';
import type { IDataImportDialogState } from './IDataImportDialogState';
import { ImportProcessorList } from './ImportProcessorList';
import { useDataImportDialog } from './useDataImportDialog';

export interface IDataImportDialogPayload {
  tableName: string;
  initialState?: IDataImportDialogState;
}

export const DataImportDialog: DialogComponent<IDataImportDialogPayload, IDataImportDialogState> = observer(function DataImportDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const dialog = useDataImportDialog(payload.initialState);

  function handleImport() {
    resolveDialog(dialog.state);
  }

  let title = translate('plugin_data_import_title');
  let icon = '/icons/data-import.png';

  if (dialog.state.step === EDataImportDialogStep.FILE && dialog.state.selectedProcessor) {
    title += ` (${dialog.state.selectedProcessor.name ?? dialog.state.selectedProcessor.id})`;
    icon = dialog.state.selectedProcessor.icon ?? icon;
  }

  return (
    <CommonDialogWrapper size="large" fixedSize>
      <CommonDialogHeader title={title} subTitle={payload.tableName} icon={icon} onReject={rejectDialog} />
      <CommonDialogBody>
        {dialog.state.step === EDataImportDialogStep.PROCESSOR && <ImportProcessorList onSelect={dialog.selectProcessor} />}
        {dialog.state.step === EDataImportDialogStep.FILE && <DataImportFileUploader state={dialog.state} onDelete={dialog.deleteFile} />}
      </CommonDialogBody>

      <CommonDialogFooter>
        <Button type="button" mod={['outlined']} onClick={rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        {dialog.state.step === EDataImportDialogStep.FILE && (
          <Container noWrap keepSize gap>
            <Button type="button" mod={['outlined']} onClick={dialog.stepBack}>
              {translate('ui_stepper_back')}
            </Button>
            <Button type="button" mod={['raised']} disabled={!dialog.state.files} onClick={handleImport}>
              {translate('ui_import')}
            </Button>
          </Container>
        )}
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
