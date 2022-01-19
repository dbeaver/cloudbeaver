/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IAuthConfigurationFormStateInfo {
  edited: boolean;
  disabled: boolean;
  readonly: boolean;
  statusMessage: string | null;
}

export interface IAuthConfigurationFormStateContext extends IAuthConfigurationFormStateInfo {
  setStatusMessage: (message: string | null) => void;
}

export function authConfigurationFormStateContext(): IAuthConfigurationFormStateContext {
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
