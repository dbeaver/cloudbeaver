/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
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
  PropertiesTable,
  s,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import type { DataTransferImportSettings } from '@cloudbeaver/core-sdk';
import { Tab, TabList, TabPanel, TabsState, TabTitle } from '@cloudbeaver/core-ui';

import { DataImportDriverConfigurationResource } from '../DataImportDriverConfigurationResource.js';
import classes from './DataImportDialog.module.css';
import { DataImportFileSelector } from './DataImportFileSelector.js';
import { EDataImportDialogStep } from './EDataImportDialogStep.js';
import { EDataImportDialogTab } from './EDataImportDialogTab.js';
import type { IDataImportDialogState } from './IDataImportDialogState.js';
import { ImportProcessorList } from './ImportProcessorList.js';
import { ImportSettingsForm } from './ImportSettingsForm.js';
import { useDataImportDialog } from './useDataImportDialog.js';

export interface IDataImportDialogResult {
  file: File;
  processorId: string;
  settings: DataTransferImportSettings;
  processorProperties?: Record<string, string | null>;
}

export interface IDataImportDialogPayload {
  tableName: string;
  connectionKey: IConnectionInfoParams;
  initialState?: IDataImportDialogState;
}

export const DataImportDialog: DialogComponent<IDataImportDialogPayload, IDataImportDialogResult> = observer(function DataImportDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const styles = useS(classes);
  const dialog = useDataImportDialog(payload.initialState);
  const driverConfigurationResource = useResource(DataImportDialog, DataImportDriverConfigurationResource, payload.connectionKey, { silent: true });

  const driverConfiguration = driverConfigurationResource.tryGetData ?? null;
  const isSettingsStep = dialog.state.step === EDataImportDialogStep.Settings;
  const hasFormatSettings = dialog.properties.length > 0;

  let title = translate('plugin_data_import_title');
  let icon = '/icons/data-import.svg';

  if (dialog.state.step !== EDataImportDialogStep.Processor && dialog.state.selectedProcessor) {
    title += ` (${dialog.state.selectedProcessor.name ?? dialog.state.selectedProcessor.id})`;
    icon = dialog.state.selectedProcessor.icon ?? icon;
  }

  function importData() {
    if (dialog.state.file && dialog.state.selectedProcessor) {
      resolveDialog({
        file: dialog.state.file,
        processorId: dialog.state.selectedProcessor.id,
        settings: dialog.state.settings,
        processorProperties: dialog.state.processorProperties,
      });
    }
  }

  function handleNext() {
    if (isSettingsStep) {
      importData();
    } else {
      dialog.stepForward(driverConfiguration);
    }
  }

  return (
    <CommonDialogWrapper className={s(styles, { container: true })} size="large" fixedSize>
      <CommonDialogHeader title={title} subTitle={payload.tableName} icon={icon} onReject={rejectDialog} />
      <CommonDialogBody noBodyPadding>
        {dialog.state.step === EDataImportDialogStep.Processor && <ImportProcessorList onSelect={dialog.selectProcessor} />}
        {dialog.state.step === EDataImportDialogStep.File &&
          (hasFormatSettings ? (
            <TabsState currentTabId={dialog.currentTabId} onChange={tab => dialog.selectTab(tab.tabId as EDataImportDialogTab)}>
              <TabList className={s(styles, { tabList: true })} aria-label={translate('plugin_data_import_title')} underline>
                <Tab tabId={EDataImportDialogTab.File}>
                  <TabTitle>{translate('plugin_data_import_file')}</TabTitle>
                </Tab>
                <Tab tabId={EDataImportDialogTab.Format}>
                  <TabTitle>{translate('plugin_data_import_format_settings')}</TabTitle>
                </Tab>
              </TabList>
              <TabPanel tabId={EDataImportDialogTab.File}>
                <DataImportFileSelector state={dialog.state} onDelete={dialog.deleteFile} />
              </TabPanel>
              <TabPanel tabId={EDataImportDialogTab.Format}>
                <PropertiesTable
                  className={s(styles, { propertiesTable: true })}
                  properties={dialog.properties}
                  propertiesState={dialog.state.processorProperties}
                />
              </TabPanel>
            </TabsState>
          ) : (
            <DataImportFileSelector state={dialog.state} onDelete={dialog.deleteFile} />
          ))}
        {dialog.state.step === EDataImportDialogStep.Settings && driverConfiguration && (
          <ImportSettingsForm settings={dialog.state.settings} driverConfiguration={driverConfiguration} />
        )}
      </CommonDialogBody>

      <CommonDialogFooter>
        <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
          {translate('ui_processing_cancel')}
        </Button>
        {dialog.state.step !== EDataImportDialogStep.Processor && (
          <div className="tw:flex tw:ml-auto tw:gap-2">
            <Button type="button" variant="secondary" onClick={dialog.stepBack}>
              {translate('ui_stepper_back')}
            </Button>
            <Button
              type="button"
              loading={driverConfigurationResource.isLoading()}
              disabled={!dialog.state.file || !dialog.state.selectedProcessor}
              onClick={handleNext}
            >
              {translate(isSettingsStep ? 'ui_import' : 'ui_stepper_next')}
            </Button>
          </div>
        )}
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
