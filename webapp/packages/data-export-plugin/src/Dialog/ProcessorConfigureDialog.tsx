/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { IProperty, PropertiesTable } from '@dbeaver/core/blocks';
import { CommonDialogWrapper } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { DataTransferProcessorInfo } from '@dbeaver/core/sdk';

import { ProcessorConfigureDialogFooter } from './ProcessorConfigureDialogFooter';

const styles = css`
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
`;

type ProcessorSelectDialogProps = {
  processor: DataTransferProcessorInfo;
  properties: IProperty[];
  processorProperties: any;
  isExporting: boolean;
  onClose(): void;
  onBack(): void;
  onExport(): void;
}

export const ProcessorConfigureDialog = observer(
  function ProcessorConfigureDialog({
    processor,
    properties,
    processorProperties,
    isExporting,
    onClose,
    onBack,
    onExport,
  }: ProcessorSelectDialogProps) {
    const translate = useTranslate();
    const title = `${translate('data_transfer_dialog_configuration_title')} (${processor.name})`;

    return styled(styles)(
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
        {isExporting && <message as="div">{translate('data_transfer_dialog_preparation')}</message>}
        {!isExporting && (
          <PropertiesTable
            properties={properties}
            propertiesState={processorProperties}
          />
        )}
      </CommonDialogWrapper>
    );
  }
);
