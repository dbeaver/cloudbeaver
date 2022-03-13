/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IProperty, PropertiesTable, ErrorMessage } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { DataTransferProcessorInfo, GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { ProcessorConfigureDialogFooter } from './ProcessorConfigureDialogFooter';

const styles = css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
    PropertiesTable {
      flex: 1;
      overflow: hidden;
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
  `;

interface Props {
  processor: DataTransferProcessorInfo;
  properties: IProperty[];
  processorProperties: any;
  error: GQLErrorCatcher;
  isExporting: boolean;
  onShowDetails: () => void;
  onClose: () => void;
  onBack: () => void;
  onExport: () => void;
}

export const ProcessorConfigureDialog = observer<Props>(function ProcessorConfigureDialog({
  processor,
  properties,
  processorProperties,
  error,
  isExporting,
  onShowDetails,
  onClose,
  onBack,
  onExport,
}) {
  const translate = useTranslate();
  const title = `${translate('data_transfer_dialog_configuration_title')} (${processor.name})`;

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      size='large'
      title={title}
      footer={(
        <ProcessorConfigureDialogFooter
          isExporting={isExporting}
          onExport={onExport}
          onBack={onBack}
          onCancel={onClose}
        />
      )}
      fixedSize
      noOverflow
      noBodyPadding
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
