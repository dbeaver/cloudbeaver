/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';

import type { DialogInternal } from '@cloudbeaver/core-dialogs';

import { ErrorBoundary } from '../ErrorBoundary.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { DialogContext, type IDialogContext } from './DialogContext.js';
import style from './DialogsPortal.module.css';

interface Props {
  dialog: DialogInternal<any>;
  resolveDialog: (result: any) => void;
  rejectDialog: (result?: any) => void;
  visible: boolean;
}

export const NestedDialog: React.FC<Props> = function NestedDialog({ dialog, resolveDialog, rejectDialog, visible }) {
  const styles = useS(style);
  const DialogComponent = dialog.component;

  const context = useMemo<IDialogContext>(
    () => ({
      dialog,
      visible,
      reject: rejectDialog,
    }),
    [dialog, visible, rejectDialog],
  );

  return (
    <DialogContext.Provider value={context}>
      <ErrorBoundary className={s(styles, { error: true }, 'tw:shadow-xlarge')} remount onClose={rejectDialog}>
        <DialogComponent
          visible={visible}
          payload={dialog.payload}
          options={dialog.options}
          resolveDialog={resolveDialog}
          rejectDialog={rejectDialog}
        />
      </ErrorBoundary>
    </DialogContext.Provider>
  );
};
