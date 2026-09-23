/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { type IProperty, useObservableRef } from '@cloudbeaver/core-blocks';
import { getObjectPropertyDefaultValue, type DataTransferImportSettings, type DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import type { IDataImportDriverConfiguration } from '../DataImportDriverConfigurationResource.js';
import { EDataImportDialogStep } from './EDataImportDialogStep.js';
import { EDataImportDialogTab } from './EDataImportDialogTab.js';
import type { IDataImportDialogState } from './IDataImportDialogState.js';

interface IDialog {
  readonly properties: IProperty[];
  state: IDataImportDialogState;
  currentTabId: EDataImportDialogTab;
  selectTab: (tabId: EDataImportDialogTab) => void;
  stepForward: (configuration: IDataImportDriverConfiguration | null) => void;
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
  processorProperties: {},
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
      state: initialState ? { ...initialState, processorProperties: initialState.processorProperties ?? {} } : DEFAULT_STATE_GETTER(),
      currentTabId: EDataImportDialogTab.File,
      get properties(): IProperty[] {
        return (this.state.selectedProcessor?.properties ?? []).flatMap(property => {
          if (!property?.id) {
            return [];
          }

          const defaultValue = getObjectPropertyDefaultValue(property);
          return [
            {
              id: property.id,
              key: property.id,
              displayName: property.displayName,
              description: property.description,
              validValues: property.validValues,
              defaultValue,
              valuePlaceholder: defaultValue,
            },
          ];
        });
      },
      selectTab(tabId: EDataImportDialogTab) {
        this.currentTabId = tabId;
      },
      stepForward(configuration: IDataImportDriverConfiguration | null) {
        if (this.currentTabId === EDataImportDialogTab.File && this.properties.length > 0) {
          this.currentTabId = EDataImportDialogTab.Format;
        } else {
          this.goToSettings(configuration);
        }
      },
      stepBack() {
        if (this.state.step === EDataImportDialogStep.Settings) {
          this.state.step = EDataImportDialogStep.File;
          this.currentTabId = this.properties.length > 0 ? EDataImportDialogTab.Format : EDataImportDialogTab.File;
        } else if (this.state.step === EDataImportDialogStep.File) {
          if (this.currentTabId === EDataImportDialogTab.Format) {
            this.currentTabId = EDataImportDialogTab.File;
          } else {
            this.state.step = EDataImportDialogStep.Processor;
          }
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
        this.currentTabId = EDataImportDialogTab.File;
        this.state.step = EDataImportDialogStep.File;
      },
      deleteFile() {
        this.state.file = null;
      },
      reset() {
        this.state = DEFAULT_STATE_GETTER();
        this.currentTabId = EDataImportDialogTab.File;
      },
    }),
    {
      state: observable,
      properties: computed,
      currentTabId: observable.ref,
      selectTab: action.bound,
      stepForward: action.bound,
      stepBack: action.bound,
      goToSettings: action.bound,
      selectProcessor: action.bound,
      deleteFile: action.bound,
      reset: action.bound,
    },
    false,
  );
}
