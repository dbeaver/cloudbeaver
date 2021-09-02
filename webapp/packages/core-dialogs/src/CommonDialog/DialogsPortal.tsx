/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import {
  Dialog,
  DialogBackdrop,
  useDialogState
} from 'reakit/Dialog';
import styled from 'reshadow';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { CommonDialogService, DialogInternal } from './CommonDialogService';
import { dialogStyles } from './styles';

export const DialogsPortal = observer(function DialogsPortal() {
  const styles = useStyles(dialogStyles);
  const commonDialogService = useService(CommonDialogService);

  let activeDialog: DialogInternal<any> | undefined;

  if (commonDialogService.dialogs.length > 0) {
    activeDialog = commonDialogService.dialogs[commonDialogService.dialogs.length - 1];
  }

  const state = useObjectRef(() => ({
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
    backdropClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      if (!this.dialog?.options?.persistent && e.currentTarget.isEqualNode(e.target as HTMLElement)) {
        this.reject();
      }
    },
  }), {
    dialog: activeDialog,
  }, ['reject', 'resolve', 'backdropClick']);

  return styled(styles)(
    <DialogBackdrop visible={!!activeDialog} onMouseDown={state.backdropClick}>
      <inner-box>
        {commonDialogService.dialogs.map((dialog, i, arr) => (
          <NestedDialog
            key={i}
            visible={i === arr.length - 1}
            dialog={dialog}
            resolveDialog={state.resolve}
            rejectDialog={state.reject}
          />
        ))}
      </inner-box>
    </DialogBackdrop>
  );
});

interface NestedDialogType {
  dialog: DialogInternal<any>;
  resolveDialog: (result: any) => void;
  rejectDialog: () => void;
  visible: boolean;
}

const NestedDialog: React.FC<NestedDialogType> = function NestedDialog({
  dialog,
  resolveDialog,
  rejectDialog,
  visible,
}) {
  const dialogState = useDialogState({ visible: true });
  const styles = useStyles(dialogStyles);

  useEffect(() => {
    if (!dialogState.visible && !dialog.options?.persistent) {
      rejectDialog();
    }
  });

  const DialogComponent = dialog.component;

  // TODO: place Dialog inside CommonDialogWrapper, so we can pass aria-label
  return styled(styles)(
    <Dialog {...dialogState} visible={visible} hideOnClickOutside={false} modal={false}>
      <DialogComponent
        payload={dialog.payload}
        options={dialog.options}
        resolveDialog={resolveDialog}
        rejectDialog={rejectDialog}
      />
    </Dialog>
  );
};
