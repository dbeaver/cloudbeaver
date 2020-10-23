/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

export interface DialogOptions {
  persistent?: boolean;
}

export interface DialogComponentProps<TPayload, TResult = DialogueStateResult> {
  payload: TPayload;
  options?: DialogOptions;
  resolveDialog: (result?: TResult) => void;
  rejectDialog: () => void; // the dialog was closed by cancel button or backdrop click
  className?: string;
}

export type DialogComponent<TPayload, TResult = DialogueStateResult> = React.FC<
DialogComponentProps<TPayload, TResult>
>;

export enum DialogueStateResult {
  Resolved,
  Rejected
}

export interface DialogInternal {
  component: DialogComponent<any, any>;
  payload: any;
  options?: DialogOptions;
  resolve: (result: any) => void;
}

@injectable()
export class CommonDialogService {
  dialogs: DialogInternal[] = observable([]);

  // note that if dialog is closed by user it will be resolved with DialogueStateResult.Rejected
  async open<TPayload, TResult>(
    component: DialogComponent<TPayload, TResult>,
    payload: TPayload,
    options?: DialogOptions
  ): Promise<TResult | DialogueStateResult> {
    return new Promise<TResult>((resolve, reject) => {
      const dialogInternal: DialogInternal = {
        component,
        payload,
        resolve,
        options,
      };
      this.dialogs.push(dialogInternal);
    });
  }

  rejectDialog(dialog: DialogInternal): void {
    dialog.resolve(DialogueStateResult.Rejected);
    this.removeDialog(dialog);
  }

  resolveDialog<TResult>(dialog: DialogInternal, result: TResult): void {
    dialog.resolve(result ?? DialogueStateResult.Resolved);
    this.removeDialog(dialog);
  }

  private removeDialog(dialog: DialogInternal) {
    const index = this.dialogs.findIndex(i => i === dialog);
    if (index !== -1) {
      this.dialogs.splice(index, 1);
    }
  }
}
