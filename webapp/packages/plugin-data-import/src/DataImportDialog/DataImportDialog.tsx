/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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

import { DataImportFileSelector } from './DataImportFileSelector.js';
import { EDataImportDialogStep } from './EDataImportDialogStep.js';
import type { IDataImportDialogState } from './IDataImportDialogState.js';
import { ImportProcessorList } from './ImportProcessorList.js';
import { useDataImportDialog } from './useDataImportDialog.js';

export interface IDataImportDialogResult {
  file: File;
  processorId: string;
}

export interface IDataImportDialogPayload {
  tableName: string;
  initialState?: IDataImportDialogState;
}

export const DataImportDialog: DialogComponent<IDataImportDialogPayload, IDataImportDialogResult> = observer(function DataImportDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const dialog = useDataImportDialog(payload.initialState);

  let title = translate('plugin_data_import_title');
  let icon = '/icons/data-import.svg';

  if (dialog.state.step === EDataImportDialogStep.File && dialog.state.selectedProcessor) {
    title += ` (${dialog.state.selectedProcessor.name ?? dialog.state.selectedProcessor.id})`;
    icon = dialog.state.selectedProcessor.icon ?? icon;
  }

  return (
    <CommonDialogWrapper size="large" fixedSize>
      <CommonDialogHeader title={title} subTitle={payload.tableName} icon={icon} onReject={rejectDialog} />
      <CommonDialogBody noBodyPadding>
        {dialog.state.step === EDataImportDialogStep.Processor && <ImportProcessorList onSelect={dialog.selectProcessor} />}
        {dialog.state.step === EDataImportDialogStep.File && <DataImportFileSelector state={dialog.state} onDelete={dialog.deleteFile} />}
      </CommonDialogBody>

      <CommonDialogFooter>
        <Button type="button" variant="secondary" onClick={rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        {dialog.state.step === EDataImportDialogStep.File && (
          <Container noWrap keepSize gap>
            <Button type="button" variant="secondary" onClick={dialog.stepBack}>
              {translate('ui_stepper_back')}
            </Button>
            <Button
              type="button"
              disabled={!dialog.state.file || !dialog.state.selectedProcessor}
              onClick={() => resolveDialog({ file: dialog.state.file!, processorId: dialog.state.selectedProcessor!.id })}
            >
              {translate('ui_import')}
            </Button>
          </Container>
        )}
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
