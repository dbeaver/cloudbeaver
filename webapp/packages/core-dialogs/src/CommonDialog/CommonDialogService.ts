/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { uuid } from '@cloudbeaver/core-utils';

export interface DialogOptions {
  persistent?: boolean;
}

export interface DialogComponentProps<TPayload = void, TResult = void> {
  visible: boolean;
  payload: TPayload;
  options?: DialogOptions;
  resolveDialog: (result?: TResult) => void;
  rejectDialog: (result?: TResult) => void; // the dialog was closed by cancel button or backdrop click
  className?: string;
}

export type DialogComponent<TPayload = void, TResult = void> = React.FC<DialogComponentProps<TPayload, TResult>>;

export enum DialogueStateResult {
  Resolved,
  Rejected,
}

export interface DialogInternal<TResult> {
  id: string;
  component: DialogComponent<any, any>;
  payload: any;
  options?: DialogOptions;
  resolve: (result: DialogResult<TResult>) => void;
  promise: Promise<DialogResult<TResult>>;
}

export interface DialogResult<TResult = void> {
  status: DialogueStateResult;
  result?: TResult;
}

@injectable()
export class CommonDialogService {
  dialogs: Array<DialogInternal<any>> = observable([], { deep: false });

  // note that if dialog is closed by user it will be resolved with DialogueStateResult.Rejected
  open<TPayload, TResult>(component: DialogComponent<TPayload, TResult>, payload: TPayload, options?: DialogOptions): Promise<DialogResult<TResult>> {
    let _resolve: (value: DialogResult<TResult>) => void;

    const promise = new Promise<DialogResult<TResult>>(resolve => {
      _resolve = resolve;
    });

    const dialogInternal: DialogInternal<TResult> = {
      id: uuid(),
      component,
      payload,
      resolve: _resolve!,
      options,
      promise,
    };
    this.dialogs.push(dialogInternal);

    return promise;
  }

  rejectDialog<TResult>(promise: Promise<DialogResult<TResult>>, result?: TResult): void {
    const dialog = this.dialogs.find(internal => internal.promise === promise);

    if (dialog) {
      dialog.resolve({ status: DialogueStateResult.Rejected, result });
      this.removeDialog(dialog);
    }
  }

  /** Please avoid using this function, it can lead to the unpredictable behavior */
  rejectAll() {
    runInAction(() => {
      for (const dialog of this.dialogs.slice()) {
        this.rejectDialog(dialog.promise);
      }
    });
  }

  resolveDialog<TResult>(promise: Promise<DialogResult<TResult>>, result?: TResult): void {
    const dialog = this.dialogs.find(internal => internal.promise === promise);

    if (dialog) {
      dialog.resolve({
        status: DialogueStateResult.Resolved,
        result,
      });
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
