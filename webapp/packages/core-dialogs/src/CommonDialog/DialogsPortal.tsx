/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useRef, useLayoutEffect } from 'react';
import {
  Dialog,
  DialogBackdrop,
  useDialogState,
} from 'reakit/Dialog';
import { Portal } from 'reakit/Portal';
import styled from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { CommonDialogService, DialogInternal } from './CommonDialogService';
import { dialogStyles } from './styles';

export const DialogsPortal = observer(function DialogsPortal() {
  const commonDialogService = useService(CommonDialogService);
  const handleReject = useCallback(
    (dialog: DialogInternal) => commonDialogService.rejectDialog(dialog),
    [commonDialogService]
  );
  const handleResolve = useCallback(
    (dialog: DialogInternal, result: any) => commonDialogService.resolveDialog(dialog, result),
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

type NestedDialogType = {
  dialog: DialogInternal;
  resolveDialog: (dialog: DialogInternal, result: any) => void;
  rejectDialog: (dialog: DialogInternal) => void;
  visible: boolean;
}

function NestedDialog(props: NestedDialogType) {
  const dialogState = useDialogState();
  const styles = useStyles(dialogStyles);
  const refToDialog = useRef<any>();
  dialogState.visible = props.visible;
  const handleReject = useCallback(() => props.rejectDialog(props.dialog), [props.dialog, props.rejectDialog]);
  const handleResolve = useCallback(
    (result: any) => props.resolveDialog(props.dialog, result),
    [props.dialog, props.resolveDialog]
  );
  const backdropClickCallback = useCallback(() => {
    if (!props.dialog.options?.persistent) {
      handleReject();
    }
  }, [props.dialog.options?.persistent, handleReject]);

  const DialogComponent = props.dialog.component;
  useLayoutEffect(() => {
    refToDialog.current?.removeAttribute('tabIndex');
  }, [refToDialog.current]);

  // TODO: place Dialog inside CommonDialogWrapper, so we can pass aria-label
  return styled(styles)(
    <>
      <Portal><DialogBackdrop {...dialogState} onClick={backdropClickCallback} /></Portal>
      <Dialog {...dialogState} ref={refToDialog} aria-label="can't be provided">
        <DialogComponent
          payload={props.dialog.payload}
          options={props.dialog.options}
          resolveDialog={handleResolve}
          rejectDialog={handleReject}
        />
      </Dialog>
    </>
  );
}
