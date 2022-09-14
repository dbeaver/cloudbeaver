/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { IProperty, PropertiesTable, ErrorMessage } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { DataTransferOutputSettings, DataTransferProcessorInfo, GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { ITabData, Tab, TabList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { OutputOptionsForm } from './OutputOptionsForm';
import { ProcessorConfigureDialogFooter } from './ProcessorConfigureDialogFooter';

const styles = css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
    PropertiesTable {
      flex: 1;
      overflow: hidden;
      padding: 12px 0;
    }
    message {
      margin: auto;
    }
    ErrorMessage {
      composes: theme-background-secondary theme-text-on-secondary from global;
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }

    TabList {
      margin: 0 10px;
    }

    ObjectPropertyInfoForm {
      margin: 12px 0;
    }
  `;

interface Props {
  processor: DataTransferProcessorInfo;
  properties: IProperty[];
  processorProperties: any;
  outputSettings: Partial<DataTransferOutputSettings>;
  error: GQLErrorCatcher;
  isExporting: boolean;
  onShowDetails: () => void;
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
  onShowDetails,
  onClose,
  onBack,
  onExport,
}) {
  const translate = useTranslate();
  const title = `${translate('data_transfer_dialog_configuration_title')} (${processor.name})`;
  const [currentTabId, setCurrentTabId] = useState(SETTINGS_TABS.EXTRACTION);

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

  return styled(useStyles(UNDERLINE_TAB_STYLES, styles))(
    <CommonDialogWrapper
      size='large'
      title={title}
      footer={(
        <ProcessorConfigureDialogFooter
          isExporting={isExporting}
          isFinalStep={currentTabId === SETTINGS_TABS.OUTPUT || !!processor.isBinary}
          onExport={onExport}
          onBack={handleBackClick}
          onCancel={onClose}
          onNext={handleNextClick}
        />
      )}
      fixedSize
      noOverflow
      noBodyPadding
      onReject={onClose}
    >
      {!processor.isBinary ? (
        <TabsState currentTabId={currentTabId} onChange={handleTabChange}>
          <TabList>
            <Tab tabId={SETTINGS_TABS.EXTRACTION} style={UNDERLINE_TAB_STYLES}>
              {translate('data_transfer_format_settings')}
            </Tab>
            <Tab tabId={SETTINGS_TABS.OUTPUT} style={UNDERLINE_TAB_STYLES}>
              {translate('data_transfer_output_settings')}
            </Tab>
          </TabList>
        </TabsState>
      ) : null}
      {currentTabId === SETTINGS_TABS.EXTRACTION ? (
        <PropertiesTable
          properties={properties}
          propertiesState={processorProperties}
        />
      ) : (
        <OutputOptionsForm outputSettings={outputSettings} />
      )}

      {error.responseMessage && (
        <ErrorMessage
          text={error.responseMessage}
          hasDetails={error.hasDetails}
          onShowDetails={onShowDetails}
        />
      )}
    </CommonDialogWrapper>
  );
});
