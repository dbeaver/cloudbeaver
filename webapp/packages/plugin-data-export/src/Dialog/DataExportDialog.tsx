/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useResource } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import type { IExportContext } from '../IExportContext.js';
import { DefaultExportOutputSettingsResource } from './DefaultExportOutputSettingsResource.js';
import { EDataExportStep } from './EDataExportStep.js';
import { ProcessorConfigureDialog } from './ProcessorConfigureDialog.js';
import { ProcessorSelectDialog } from './ProcessorSelectDialog.js';
import { useDataExportDialog } from './useDataExportDialog.js';

export const DataExportDialog: DialogComponent<IExportContext> = observer(function DataExportDialog({ payload, rejectDialog }) {
  useResource(DataExportDialog, DefaultExportOutputSettingsResource, undefined, { forceSuspense: true });

  const dialog = useDataExportDialog(payload, rejectDialog);

  if (dialog.step === EDataExportStep.Configure && dialog.processor) {
    return (
      <ProcessorConfigureDialog
        processor={dialog.processor}
        properties={dialog.properties}
        processorProperties={dialog.processorProperties}
        error={dialog.exception}
        isExporting={dialog.processing}
        outputSettings={dialog.outputSettings}
        onBack={() => dialog.setStep(EDataExportStep.DataTransferProcessor)}
        onClose={rejectDialog}
        onExport={dialog.export}
      />
    );
  }

  return <ProcessorSelectDialog context={payload} onSelect={dialog.selectProcessor} onClose={rejectDialog} />;
});
