/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IRoleFormStateInfo {
  edited: boolean;
  disabled: boolean;
  readonly: boolean;
  statusMessage: string | null;
}

export interface IRoleFormStateContext extends IRoleFormStateInfo {
  setStatusMessage: (message: string | null) => void;
}

export function roleFormStateContext(): IRoleFormStateContext {
  return {
    edited: false,
    disabled: false,
    readonly: false,
    statusMessage: null,
    setStatusMessage(message: string | null) {
      this.statusMessage = message;
    },
  };
}
