/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { CommonDialogBody, CommonDialogHeader, CommonDialogWrapper, Loader, s, useS } from '@cloudbeaver/core-blocks';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import type { IExportContext } from '../IExportContext';
import { ExportProcessorList } from './ExportProcessorList/ExportProcessorList';
import style from './ProcessorSelectDialog.m.css';

interface Props {
  context: IExportContext;
  processors: DataTransferProcessorInfo[];
  isLoading: boolean;
  onSelect: (processorId: string) => void;
  onClose: () => void;
}

export const ProcessorSelectDialog = observer<Props>(function ProcessorSelectDialog({ context, processors, isLoading, onSelect, onClose }) {
  const styles = useS(style);

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
        {isLoading && <Loader />}
        {!isLoading && <ExportProcessorList className={s(styles, { exportProcessorList: true })} processors={processors} onSelect={onSelect} />}
      </CommonDialogBody>
    </CommonDialogWrapper>
  );
});
