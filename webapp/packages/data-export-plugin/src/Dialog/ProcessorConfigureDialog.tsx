/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Loader, IProperty, PropertiesTable } from '@dbeaver/core/blocks';
import { CommonDialogWrapper } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { DataTransferProcessorInfo } from '@dbeaver/core/sdk';

import { ProcessorConfigureDialogFooter } from './ProcessorConfigureDialogFooter';

const styles = css`
  CommonDialogWrapper {
    display: flex;
    min-height: 330px;
  }
  PropertiesTable {
    flex: 1;
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
    const title = `${useTranslate('data_transfer_dialog_configuration_title')} (${processor.name})`;

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
        {isExporting && <Loader />}
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
