/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { DataTransferImportSettings, DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import type { IDataImportDriverConfiguration } from '../DataImportDriverConfigurationResource.js';
import { EDataImportDialogStep } from './EDataImportDialogStep.js';
import type { IDataImportDialogState } from './IDataImportDialogState.js';

interface IDialog {
  state: IDataImportDialogState;
  stepBack: () => void;
  goToSettings: (configuration: IDataImportDriverConfiguration | null) => void;
  selectProcessor: (processor: DataTransferProcessorInfo) => void;
  deleteFile: () => void;
  reset: () => void;
}

const DEFAULT_STATE_GETTER: () => IDataImportDialogState = () => ({
  step: EDataImportDialogStep.Processor,
  file: null,
  selectedProcessor: null,
  settings: {},
});

function getDefaultSettings(configuration: IDataImportDriverConfiguration): DataTransferImportSettings {
  const settings: DataTransferImportSettings = {
    openNewConnection: true,
  };

  if (configuration.supportsTransactions) {
    settings.useTransactions = true;
  }

  if (configuration.supportedInsertReplaceMethods) {
    settings.onDuplicateKeyMethod = undefined;
  }

  if (configuration.supportsBulkLoad) {
    settings.useBulkLoad = false;
  }

  return settings;
}

export function useDataImportDialog(initialState?: IDataImportDialogState): IDialog {
  return useObservableRef<IDialog>(
    () => ({
      state: initialState ?? DEFAULT_STATE_GETTER(),
      stepBack() {
        if (this.state.step === EDataImportDialogStep.Settings) {
          this.state.step = EDataImportDialogStep.File;
        } else if (this.state.step === EDataImportDialogStep.File) {
          this.state.step = EDataImportDialogStep.Processor;
        }
      },
      goToSettings(configuration: IDataImportDriverConfiguration | null) {
        if (configuration) {
          this.state.settings = { ...getDefaultSettings(configuration), ...this.state.settings };
        }
        this.state.step = EDataImportDialogStep.Settings;
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
    {
      state: observable,
      stepBack: action.bound,
      goToSettings: action.bound,
      selectProcessor: action.bound,
      deleteFile: action.bound,
      reset: action.bound,
    },
    false,
  );
}
