/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IConnectionFormStateInfo {
  edited: boolean;
  disabled: boolean;
  readonly: boolean;
  statusMessage: string | null;
}

export interface IConnectionFormStateContext extends IConnectionFormStateInfo {
  markEdited: () => void;
  setStatusMessage: (message: string | null) => void;
}

export function connectionFormStateContext(): IConnectionFormStateContext {
  return {
    edited: false,
    disabled: false,
    readonly: false,
    statusMessage: null,
    markEdited() {
      this.edited = true;
    },
    setStatusMessage(message: string | null) {
      this.statusMessage = message;
    },
  };
}
