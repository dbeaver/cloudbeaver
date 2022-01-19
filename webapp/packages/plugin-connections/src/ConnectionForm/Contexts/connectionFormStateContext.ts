/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IFormStateInfo } from '@cloudbeaver/core-blocks';

export interface IConnectionFormStateContext extends IFormStateInfo {
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
