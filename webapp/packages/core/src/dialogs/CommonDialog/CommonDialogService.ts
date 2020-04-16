/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';

export type DialogComponentProps<TPayload, TResult> = {
  payload: TPayload;
  resolveDialog(result: TResult | null): void;
  rejectDialog(): void; // the dialog was closed by cancel button or backdrop click
}

export type DialogComponent<TPayload, TResult> = React.ElementType<
  DialogComponentProps<TPayload, TResult>
>

export interface DialogInternal {
  component: DialogComponent<any, any>;
  payload: any;
  resolve(result: any): void;
}

@injectable()
export class CommonDialogService {
  dialogs: DialogInternal[] = observable([])

  // note that if dialog is closed by user it will be resolved with null
  async open<TPayload, TResult>(
    dialog: DialogComponent<TPayload, TResult>,
    payload: TPayload
  ): Promise<TResult | null> {
    return new Promise<TResult>((resolve, reject) => {
      const dialogInternal: DialogInternal = {
        component: dialog,
        payload,
        resolve,
      };
      this.dialogs.push(dialogInternal);
    });
  }

  rejectDialog(dialog: DialogInternal): void {
    dialog.resolve(null);
    this.removeDialog(dialog);
  }

  resolveDialog<TResult>(dialog: DialogInternal, result: TResult): void {
    dialog.resolve(result);
    this.removeDialog(dialog);
  }

  private removeDialog(dialog: DialogInternal) {
    const index = this.dialogs.findIndex(i => i === dialog);
    if (index !== -1) {
      this.dialogs.splice(index, 1);
    }
  }
}
