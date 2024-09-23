/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { CommonDialogBody, CommonDialogHeader, CommonDialogWrapper, s, useResource, useS } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import { DataTransferProcessorsResource } from '../DataTransferProcessorsResource.js';
import type { IExportContext } from '../IExportContext.js';
import { ExportProcessorList } from './ExportProcessorList/ExportProcessorList.js';
import style from './ProcessorSelectDialog.module.css';

interface Props {
  context: IExportContext;
  onSelect: (processorId: string) => void;
  onClose: () => void;
}

export const ProcessorSelectDialog = observer<Props>(function ProcessorSelectDialog({ context, onSelect, onClose }) {
  const styles = useS(style);
  const dataTransferProcessorsResource = useResource(ProcessorSelectDialog, DataTransferProcessorsResource, CachedMapAllKey, {
    forceSuspense: true,
  });

  const processors = dataTransferProcessorsResource.resource.values.slice().sort(sortProcessors);

  return (
    <CommonDialogWrapper size="large" fixedSize>
      <CommonDialogHeader title="data_transfer_dialog_title" subTitle={context.name} onReject={onClose} />
      <CommonDialogBody noBodyPadding noOverflow>
        {context.query && (
          <div className={s(styles, { exportObject: true })}>
            <pre className={s(styles, { pre: true })} title={context.query}>
              {context.query}
            </pre>
          </div>
        )}
        <ExportProcessorList className={s(styles, { exportProcessorList: true })} processors={processors} onSelect={onSelect} />
      </CommonDialogBody>
    </CommonDialogWrapper>
  );
});

function sortProcessors(processorA: DataTransferProcessorInfo, processorB: DataTransferProcessorInfo): number {
  if (processorA.order === processorB.order) {
    return (processorA.name || '').localeCompare(processorB.name || '');
  }

  return processorA.order - processorB.order;
}
