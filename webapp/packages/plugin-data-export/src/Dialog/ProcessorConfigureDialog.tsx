/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { IProperty, PropertiesTable, ErrorMessage } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { DataTransferProcessorInfo, GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { ProcessorConfigureDialogFooter } from './ProcessorConfigureDialogFooter';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    CommonDialogWrapper {
      max-height: 500px;
      min-height: 500px;
    }
    PropertiesTable {
      flex: 1;
    }
    message {
      margin: auto;
    }
    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }
  `
);

type ProcessorSelectDialogProps = {
  processor: DataTransferProcessorInfo;
  properties: IProperty[];
  processorProperties: any;
  error: GQLErrorCatcher;
  isExporting: boolean;
  onShowDetails(): void;
  onClose(): void;
  onBack(): void;
  onExport(): void;
}

export const ProcessorConfigureDialog = observer(
  function ProcessorConfigureDialog({
    processor,
    properties,
    processorProperties,
    error,
    isExporting,
    onShowDetails,
    onClose,
    onBack,
    onExport,
  }: ProcessorSelectDialogProps) {
    const translate = useTranslate();
    const title = `${translate('data_transfer_dialog_configuration_title')} (${processor.name})`;

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={title}
        noBodyPadding
        footer={
          <ProcessorConfigureDialogFooter
            isExporting={isExporting}
            onExport={onExport}
            onBack={onBack}
            onCancel={onClose}
          />
        }
        onReject={onClose}
      >
        <PropertiesTable
          properties={properties}
          propertiesState={processorProperties}
        />
        {error.responseMessage && (
          <ErrorMessage
            text={error.responseMessage}
            hasDetails={error.hasDetails}
            onShowDetails={onShowDetails}
          />
        )}
      </CommonDialogWrapper>
    );
  }
);
