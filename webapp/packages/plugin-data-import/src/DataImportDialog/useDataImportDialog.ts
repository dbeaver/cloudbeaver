/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import { EDataImportDialogStep } from './EDataImportDialogStep.js';
import type { IDataImportDialogState } from './IDataImportDialogState.js';

interface IDialog {
  state: IDataImportDialogState;
  stepBack: () => void;
  selectProcessor: (processor: DataTransferProcessorInfo) => void;
  deleteFile: () => void;
  reset: () => void;
}

const DEFAULT_STATE_GETTER: () => IDataImportDialogState = () => ({
  step: EDataImportDialogStep.Processor,
  file: null,
  selectedProcessor: null,
});

export function useDataImportDialog(initialState?: IDataImportDialogState) {
  const dialog = useObservableRef<IDialog>(
    () => ({
      state: initialState ?? DEFAULT_STATE_GETTER(),
      stepBack() {
        if (this.state.step === EDataImportDialogStep.File) {
          this.state.step = EDataImportDialogStep.Processor;
        }
      },
      selectProcessor(processor: DataTransferProcessorInfo) {
        if (this.state.selectedProcessor && this.state.selectedProcessor.id !== processor.id) {
          this.reset();
        }

        this.state.selectedProcessor = processor;
        this.state.step = EDataImportDialogStep.File;
      },
      deleteFile() {
        this.state.file = null;
      },
      reset() {
        this.state = DEFAULT_STATE_GETTER();
      },
    }),
    { state: observable, stepBack: action.bound, selectProcessor: action.bound, deleteFile: action.bound, reset: action.bound },
    false,
  );

  return dialog;
}
