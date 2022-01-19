/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { DialogBackdrop } from 'reakit/Dialog';
import styled from 'reshadow';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { CommonDialogService, DialogInternal } from './CommonDialogService';
import { DialogContext, IDialogContext } from './DialogContext';
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
  const DialogComponent = dialog.component;

  const context = useMemo<IDialogContext>(() => ({
    dialog,
    visible,
    reject: rejectDialog,
  }), [dialog, visible, rejectDialog]);

  return (
    <DialogContext.Provider value={context}>
      <DialogComponent
        visible={visible}
        payload={dialog.payload}
        options={dialog.options}
        resolveDialog={resolveDialog}
        rejectDialog={rejectDialog}
      />
    </DialogContext.Provider>
  );
};
