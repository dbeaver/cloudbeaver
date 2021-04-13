/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IConnectionFormStateContext {
  edited: boolean;

  markEdited: () => void;
}

export function connectionFormStateContext(): IConnectionFormStateContext {
  return {
    edited: false,
    markEdited() {
      this.edited = true;
    },
  };
}
