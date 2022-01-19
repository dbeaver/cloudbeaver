/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
  visible: boolean;
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

export interface DialogInternal<TResult> {
  component: DialogComponent<any, any>;
  payload: any;
  options?: DialogOptions;
  resolve: (result: TResult | DialogueStateResult) => void;
  promise: Promise<TResult | DialogueStateResult>;
}

@injectable()
export class CommonDialogService {
  dialogs: Array<DialogInternal<any>> = observable([], { deep: false });

  // note that if dialog is closed by user it will be resolved with DialogueStateResult.Rejected
  open<TPayload, TResult>(
    component: DialogComponent<TPayload, TResult>,
    payload: TPayload,
    options?: DialogOptions
  ): Promise<TResult | DialogueStateResult> {
    let _resolve: (value: TResult | DialogueStateResult) => void;
    let _reject: (reason?: any) => void;

    const promise = new Promise<TResult | DialogueStateResult>((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    const dialogInternal: DialogInternal<TResult> = {
      component,
      payload,
      resolve: _resolve!,
      options,
      promise,
    };
    this.dialogs.push(dialogInternal);

    return promise;
  }

  rejectDialog(promise: Promise<any>): void {
    const dialog = this.dialogs.find(internal => internal.promise === promise);

    if (dialog) {
      dialog.resolve(DialogueStateResult.Rejected);
      this.removeDialog(dialog);
    }
  }

  resolveDialog<TResult>(promise: Promise<TResult | DialogueStateResult>, result?: TResult): void {
    const dialog = this.dialogs.find(internal => internal.promise === promise);

    if (dialog) {
      dialog.resolve(result ?? DialogueStateResult.Resolved);
      this.removeDialog(dialog);
    }
  }

  private removeDialog(dialog: DialogInternal<any>) {
    const index = this.dialogs.findIndex(i => i === dialog);
    if (index !== -1) {
      this.dialogs.splice(index, 1);
    }
  }
}
