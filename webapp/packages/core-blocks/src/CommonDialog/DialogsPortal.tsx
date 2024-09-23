/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { DialogBackdrop } from 'reakit';

import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogInternal } from '@cloudbeaver/core-dialogs';

import { ErrorBoundary } from '../ErrorBoundary.js';
import { Loader } from '../Loader/Loader.js';
import { s } from '../s.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import { DialogContext, type IDialogContext } from './DialogContext.js';
import style from './DialogsPortal.module.css';

export const DialogsPortal = observer(function DialogsPortal() {
  const styles = useS(style);
  const commonDialogService = useService(CommonDialogService);
  const focusedElementRef = useRef<HTMLElement | null>(null);

  let activeDialog: DialogInternal<any> | undefined;

  if (commonDialogService.dialogs.length > 0) {
    activeDialog = commonDialogService.dialogs[commonDialogService.dialogs.length - 1];
  }

  const state = useObjectRef(
    () => ({
      reject() {
        if (this.dialog) {
          commonDialogService.rejectDialog(this.dialog.promise);
        }
      },
      resolve(result: any) {
        if (this.dialog) {
          commonDialogService.resolveDialog(this.dialog.promise, result);
        }
      },
      backdropClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target !== e.currentTarget) {
          return;
        }

        e.preventDefault(); // prevent focus loss
        if (!this.dialog?.options?.persistent && e.currentTarget.isEqualNode(e.target as HTMLElement)) {
          this.reject();
        }
      },
    }),
    {
      dialog: activeDialog,
    },
    ['reject', 'resolve', 'backdropClick'],
  );

  useMemo(() => {
    if (!activeDialog) {
      return;
    }

    // capture focused element before dialog open
    if (document.activeElement instanceof HTMLElement) {
      focusedElementRef.current = document.activeElement;
    }
  }, [activeDialog]);

  useLayoutEffect(() => {
    if (!activeDialog) {
      return;
    }

    return () => {
      // restore focus after dialog close
      focusedElementRef.current?.focus();
      focusedElementRef.current = null;
    };
  }, [activeDialog]);

  return (
    <DialogBackdrop className={s(styles, { backdrop: true })} visible={!!activeDialog} onMouseDown={state.backdropClick}>
      <Loader className={s(styles, { loader: true })} suspense>
        <div className={s(styles, { innerBox: true })}>
          {commonDialogService.dialogs.map((dialog, i, arr) => (
            <NestedDialog key={dialog.id} visible={i === arr.length - 1} dialog={dialog} resolveDialog={state.resolve} rejectDialog={state.reject} />
          ))}
        </div>
      </Loader>
    </DialogBackdrop>
  );
});

interface NestedDialogType {
  dialog: DialogInternal<any>;
  resolveDialog: (result: any) => void;
  rejectDialog: () => void;
  visible: boolean;
}

const NestedDialog: React.FC<NestedDialogType> = function NestedDialog({ dialog, resolveDialog, rejectDialog, visible }) {
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
      <ErrorBoundary className={s(styles, { error: true })} remount onClose={rejectDialog}>
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
