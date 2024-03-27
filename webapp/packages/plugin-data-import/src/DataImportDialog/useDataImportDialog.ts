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

import { EDataImportDialogStep } from './EDataImportDialogStep';
import type { IDataImportDialogState } from './IDataImportDialogState';

interface IDialog {
  state: IDataImportDialogState;
  stepBack: () => void;
  selectProcessor: (processor: DataTransferProcessorInfo) => void;
  deleteFile: (id: string) => void;
  reset: () => void;
}

const DEFAULT_STATE_GETTER: () => IDataImportDialogState = () => ({
  step: EDataImportDialogStep.PROCESSOR,
  files: null,
  selectedProcessor: null,
});

export function useDataImportDialog(initialState?: IDataImportDialogState) {
  const dialog = useObservableRef<IDialog>(
    () => ({
      state: initialState ?? DEFAULT_STATE_GETTER(),
      stepBack() {
        this.state.step = EDataImportDialogStep.PROCESSOR;
      },
      selectProcessor(processor: DataTransferProcessorInfo) {
        if (this.state.selectedProcessor && this.state.selectedProcessor.id !== processor.id) {
          this.reset();
        }

        this.state.selectedProcessor = processor;
        this.state.step = EDataImportDialogStep.FILE;
      },
      deleteFile(id: string) {
        if (this.state.files) {
          const libraries = Array.from(this.state.files);
          const uploadedIndex = libraries.findIndex(l => l.name === id);

          if (uploadedIndex > -1) {
            libraries.splice(uploadedIndex, 1);

            const dt = new DataTransfer();

            for (let i = 0; i < libraries.length; i++) {
              const file = libraries[i];
              dt.items.add(file);
            }

            this.state.files = dt.files;
            return;
          }
        }
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
