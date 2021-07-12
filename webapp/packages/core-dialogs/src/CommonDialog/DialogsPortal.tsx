/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useRef } from 'react';
import {
  Dialog,
  DialogBackdrop,
  useDialogState
} from 'reakit/Dialog';
import styled from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { CommonDialogService, DialogInternal } from './CommonDialogService';
import { dialogStyles } from './styles';

export const DialogsPortal = observer(function DialogsPortal() {
  const commonDialogService = useService(CommonDialogService);
  const handleReject = useCallback(
    (dialog: DialogInternal<any>) => commonDialogService.rejectDialog(dialog.promise),
    [commonDialogService]
  );
  const handleResolve = useCallback(
    (dialog: DialogInternal<any>, result: any) => commonDialogService.resolveDialog(dialog.promise, result),
    [commonDialogService]
  );

  return (
    <>
      {commonDialogService.dialogs.map((dialog, i, arr) => (
        <NestedDialog
          key={i}
          visible={i === arr.length - 1}
          dialog={dialog}
          resolveDialog={handleResolve}
          rejectDialog={handleReject}
        />
      ))}
    </>
  );
});

interface NestedDialogType {
  dialog: DialogInternal<any>;
  resolveDialog: (dialog: DialogInternal<any>, result: any) => void;
  rejectDialog: (dialog: DialogInternal<any>) => void;
  visible: boolean;
}

function NestedDialog({
  dialog,
  resolveDialog,
  rejectDialog,
  visible,
}: NestedDialogType) {
  const lastVisibility = useRef(visible);
  const dialogState = useDialogState({ visible });
  const styles = useStyles(dialogStyles);

  if (!dialogState.visible
    && dialogState.visible !== lastVisibility.current
    && !dialog.options?.persistent
  ) {
    rejectDialog(dialog);
  } else {
    lastVisibility.current = visible;
    dialogState.setVisible(visible);
  }

  const handleReject = useCallback(() => rejectDialog(dialog), [dialog, rejectDialog]);
  const handleResolve = useCallback(
    (result: any) => resolveDialog(dialog, result),
    [dialog, resolveDialog]
  );

  const DialogComponent = dialog.component;

  const backdropClickHandler = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!dialog.options?.persistent && e.currentTarget.isEqualNode(e.target as HTMLElement)) {
      rejectDialog(dialog);
    }
  };

  // TODO: place Dialog inside CommonDialogWrapper, so we can pass aria-label
  return styled(styles)(
    <>
      <DialogBackdrop {...dialogState} onMouseDown={backdropClickHandler}>
        <Dialog {...dialogState} hideOnClickOutside={false}>
          <DialogComponent
            payload={dialog.payload}
            options={dialog.options}
            resolveDialog={handleResolve}
            rejectDialog={handleReject}
          />
        </Dialog>
      </DialogBackdrop>
    </>
  );
}
