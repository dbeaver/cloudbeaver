/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import {
  Dialog,
  DialogBackdrop,
  useDialogState,
} from 'reakit/Dialog';
import styled from 'reshadow';

import { useService } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

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
  dialogState.visible = props.visible;
  const handleReject = useCallback(() => props.rejectDialog(props.dialog), [props.dialog, props.rejectDialog]);
  const handleResolve = useCallback(
    (result: any) => props.resolveDialog(props.dialog, result),
    [props.dialog, props.resolveDialog]
  );

  const DialogComponent = props.dialog.component;

  // TODO: place Dialog inside CommonDialogWrapper, so we can pass aria-label
  return styled(styles)(
    <Dialog {...dialogState} aria-label="can't be provided" tabIndex={0}>
      <DialogBackdrop {...dialogState} onClick={handleReject} />
      <DialogComponent
        payload={props.dialog.payload}
        resolveDialog={handleResolve}
        rejectDialog={handleReject}
      />
    </Dialog>
  );
}
