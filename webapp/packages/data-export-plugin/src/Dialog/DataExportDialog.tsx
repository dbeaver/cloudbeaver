/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useController } from '@dbeaver/core/di';
import { DialogComponent } from '@dbeaver/core/dialogs';

import { IExportContext } from '../IExportContext';
import { DataExportController, DataExportStep } from './DataExportController';
import { ProcessorConfigureDialog } from './ProcessorConfigureDialog';
import { ProcessorSelectDialog } from './ProcessorSelectDialog';

export const DataExportDialog: DialogComponent<IExportContext, null> = observer(
  function DataExportDialog(props) {
    const controller = useController(DataExportController, props.payload, props.rejectDialog);

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
          onClose={props.rejectDialog}
          onExport={controller.prepareExport}
        />
      );
    }

    return (
      <ProcessorSelectDialog
        context={props.payload}
        processors={controller.processors}
        onSelect={controller.selectProcessor}
        isLoading={controller.isLoading}
        onClose={props.rejectDialog}
      />
    );
  }
);
