/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled from 'reshadow';

import {
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  ErrorMessage,
  IProperty,
  PropertiesTable,
  s,
  useErrorDetails,
  useS,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DataTransferOutputSettings, DataTransferProcessorInfo, GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { ITabData, Tab, TabList, TabsState, TabTitle, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { OutputOptionsForm } from './OutputOptionsForm';
import style from './ProcessorConfigureDialog.m.css';
import { ProcessorConfigureDialogFooter } from './ProcessorConfigureDialogFooter';

interface Props {
  processor: DataTransferProcessorInfo;
  properties: IProperty[];
  processorProperties: any;
  outputSettings: Partial<DataTransferOutputSettings>;
  error: Error | null;
  isExporting: boolean;
  onClose: () => void;
  onBack: () => void;
  onExport: () => void;
}

enum SETTINGS_TABS {
  EXTRACTION = 'EXTRACTION',
  OUTPUT = 'OUTPUT',
}

export const ProcessorConfigureDialog = observer<Props>(function ProcessorConfigureDialog({
  processor,
  properties,
  processorProperties,
  outputSettings,
  error,
  isExporting,
  onClose,
  onBack,
  onExport,
}) {
  const translate = useTranslate();
  const styles = useS(style);

  const title = `${translate('data_transfer_dialog_configuration_title')} (${processor.name})`;
  const [currentTabId, setCurrentTabId] = useState(SETTINGS_TABS.EXTRACTION);
  const errorDetails = useErrorDetails(error);

  function handleTabChange(tab: ITabData) {
    setCurrentTabId(tab.tabId as SETTINGS_TABS);
  }

  function handleNextClick() {
    setCurrentTabId(SETTINGS_TABS.OUTPUT);
  }

  function handleBackClick() {
    if (currentTabId === SETTINGS_TABS.OUTPUT) {
      setCurrentTabId(SETTINGS_TABS.EXTRACTION);
    } else {
      onBack();
    }
  }

  return styled(useStyles(UNDERLINE_TAB_STYLES))(
    <CommonDialogWrapper className={s(styles, { container: true })} size="large" fixedSize>
      <CommonDialogHeader title={title} onReject={onClose} />
      <CommonDialogBody noOverflow noBodyPadding>
        {!processor.isBinary ? (
          <TabsState currentTabId={currentTabId} onChange={handleTabChange}>
            <TabList className={s(styles, { tabList: true })} aria-label="Export Settings tabs">
              <Tab tabId={SETTINGS_TABS.EXTRACTION} style={UNDERLINE_TAB_STYLES}>
                <TabTitle>{translate('data_transfer_format_settings')}</TabTitle>
              </Tab>
              <Tab tabId={SETTINGS_TABS.OUTPUT} style={UNDERLINE_TAB_STYLES}>
                <TabTitle>{translate('data_transfer_output_settings')}</TabTitle>
              </Tab>
            </TabList>
          </TabsState>
        ) : null}
        {currentTabId === SETTINGS_TABS.EXTRACTION ? (
          <PropertiesTable className={s(styles, { propertiesTable: true })} properties={properties} propertiesState={processorProperties} />
        ) : (
          <OutputOptionsForm outputSettings={outputSettings} />
        )}

        {error && (
          <ErrorMessage
            className={s(styles, { errorMessage: true })}
            text={errorDetails.message ?? translate('core_blocks_exception_message_error_message')}
            hasDetails={errorDetails.hasDetails}
            onShowDetails={errorDetails.open}
          />
        )}
      </CommonDialogBody>
      <CommonDialogFooter>
        <ProcessorConfigureDialogFooter
          isExporting={isExporting}
          isFinalStep={currentTabId === SETTINGS_TABS.OUTPUT || !!processor.isBinary}
          onExport={onExport}
          onBack={handleBackClick}
          onCancel={onClose}
          onNext={handleNextClick}
        />
      </CommonDialogFooter>
    </CommonDialogWrapper>,
  );
});
