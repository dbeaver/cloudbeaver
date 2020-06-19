/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useController } from '@cloudbeaver/core-di';
import { DialogComponentProps } from '@cloudbeaver/core-dialogs';

import { IExportContext } from '../IExportContext';
import { DataExportController, DataExportStep } from './DataExportController';
import { ProcessorConfigureDialog } from './ProcessorConfigureDialog';
import { ProcessorSelectDialog } from './ProcessorSelectDialog';

export const DataExportDialog = observer(function DataExportDialog({
  payload,
  rejectDialog,
}: DialogComponentProps<IExportContext, null>) {
  const controller = useController(DataExportController, payload, rejectDialog);

  if (controller.step === DataExportStep.Configure && controller.processor) {
    return (
      <ProcessorConfigureDialog
        processor={controller.processor}
        properties={controller.properties}
        processorProperties={controller.processorProperties}
        error={controller.error}
        isExporting={controller.isExporting}
        onShowDetails={controller.showDetails}
        onBack={() => controller.setStep(DataExportStep.DataTransferProcessor)}
        onClose={rejectDialog}
        onExport={controller.prepareExport}
      />
    );
  }

  return (
    <ProcessorSelectDialog
      context={payload}
      processors={controller.processors}
      onSelect={controller.selectProcessor}
      isLoading={controller.isLoading}
      onClose={rejectDialog}
    />
  );
});
