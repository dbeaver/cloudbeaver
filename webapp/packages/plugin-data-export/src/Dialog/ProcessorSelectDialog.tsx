/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogHeader, CommonDialogWrapper } from '@cloudbeaver/core-dialogs';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';
import { useNode } from '@cloudbeaver/plugin-navigation-tree';

import type { IExportContext } from '../IExportContext';
import { ExportProcessorList } from './ExportProcessorList/ExportProcessorList';

const styles = css`
  ExportProcessorList {
    flex: 1;
  }
  export-object {
    composes: theme-typography--body2 from global;
    flex-shrink: 0;
    padding: 16px 24px;
    padding-top: 0;
    max-height: 50px;
    overflow: hidden;

    & pre {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: initial;
    }
  }
  pre {
    composes: theme-typography--caption from global;
  }
`;

interface Props {
  context: IExportContext;
  processors: DataTransferProcessorInfo[];
  isLoading: boolean;
  onSelect: (processorId: string) => void;
  onClose: () => void;
}

export const ProcessorSelectDialog = observer<Props>(function ProcessorSelectDialog({
  context,
  processors,
  isLoading,
  onSelect,
  onClose,
}) {
  const translate = useTranslate();
  const { node } = useNode(context.containerNodePath || '');

  return styled(styles)(
    <CommonDialogWrapper size='large' fixedSize>
      <CommonDialogHeader
        title="data_transfer_dialog_title"
        onReject={onClose}
      />
      <CommonDialogBody noBodyPadding noOverflow>
        <export-object>
          {!context.sourceName && `${translate('data_transfer_exporting_table')} ${node?.name}`}
          <pre title={context.sourceName}>{context.sourceName}</pre>
        </export-object>
        {isLoading && <Loader />}
        {!isLoading && <ExportProcessorList processors={processors} onSelect={onSelect} />}
      </CommonDialogBody>
    </CommonDialogWrapper>
  );
}
);
