/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useNode } from '@cloudbeaver/core-app';
import { Loader } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import { IExportContext } from '../IExportContext';
import { ExportProcessorList } from './ExportProcessorList/ExportProcessorList';

const styles = css`
  CommonDialogWrapper {
    max-height: 500px;
    min-height: 500px;
  }
  ExportProcessorList {
    flex: 1;
  }
  export-object {
    composes: theme-typography--body2 from global;
    flex-shrink: 0;
    padding: 16px;
    max-height: 50px;
    overflow: hidden;

    & pre {
      margin: 0;
    }
  }
`;

type ProcessorSelectDialogProps = {
  context: IExportContext;
  processors: DataTransferProcessorInfo[];
  isLoading: boolean;
  onSelect(processorId: string): void;
  onClose(): void;
}

export const ProcessorSelectDialog = observer(
  function ProcessorSelectDialog({
    context,
    processors,
    isLoading,
    onSelect,
    onClose,
  }: ProcessorSelectDialogProps) {
    const translate = useTranslate();
    const { node } = useNode(context.containerNodePath || '');

    return styled(styles)(
      <CommonDialogWrapper
        title={translate('data_transfer_dialog_title')}
        noBodyPadding
        onReject={onClose}
      >
        <export-object as="div">
          {context.sourceName ? translate('data_transfer_exporting_sql') : `${translate('data_transfer_exporting_table')} ${node?.name}`}
          <pre title={context.sourceName}>{context.sourceName}</pre>
        </export-object>
        {isLoading && <Loader />}
        {!isLoading && <ExportProcessorList processors={processors} onSelect={onSelect}/>}
      </CommonDialogWrapper>
    );
  }
);
