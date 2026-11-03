/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogInternal } from '@cloudbeaver/core-dialogs';

import { Loader } from '../Loader/Loader.js';
import { s } from '../s.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import style from './DialogsPortal.module.css';
import { NestedDialog } from './NestedDialog.js';

export const DialogsPortal = observer(function DialogsPortal() {
  const styles = useS(style);
  const commonDialogService = useService(CommonDialogService);

  let activeDialog: DialogInternal<any> | undefined;

  if (commonDialogService.dialogs.length > 0) {
    activeDialog = commonDialogService.dialogs[commonDialogService.dialogs.length - 1];
  }

  const state = useObjectRef(
    () => ({
      reject(result?: any) {
        if (this.dialog) {
          commonDialogService.rejectDialog(this.dialog.promise, result);
        }
      },
      resolve(result: any) {
        if (this.dialog) {
          commonDialogService.resolveDialog(this.dialog.promise, result);
        }
      },
    }),
    {
      dialog: activeDialog,
    },
    ['reject', 'resolve'],
  );

  if (!activeDialog) {
    return null;
  }

  return (
    <div className={s(styles, { backdrop: true })}>
      <Loader className={s(styles, { loader: true })} suspense>
        <div className={s(styles, { innerBox: true })}>
          {commonDialogService.dialogs.map((dialog, i, arr) => (
            <NestedDialog key={dialog.id} visible={i === arr.length - 1} dialog={dialog} resolveDialog={state.resolve} rejectDialog={state.reject} />
          ))}
        </div>
      </Loader>
    </div>
  );
});
