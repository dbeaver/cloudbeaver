/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ENotificationType } from '@cloudbeaver/core-events';

import type { IFormStateInfo } from './IFormStateInfo.js';

export interface IFormStateContext extends IFormStateInfo {
  markEdited: () => void;
  setInfo(message: string): void;
  setError(message: string): void;
  setSuccess(message: string): void;
  setLoading(message: string): void;
  setMessage(message: string, type: ENotificationType): void;
}

export function formStateContext(): IFormStateContext {
  return {
    edited: false,
    disabled: false,
    readonly: false,
    statusMessage: null,
    statusType: null,
    markEdited() {
      this.edited = true;
    },
    setInfo(message) {
      this.setMessage(message, ENotificationType.Info);
    },
    setError(message) {
      this.setMessage(message, ENotificationType.Error);
    },
    setSuccess(message) {
      this.setMessage(message, ENotificationType.Success);
    },
    setLoading(message) {
      this.setMessage(message, ENotificationType.Loading);
    },
    setMessage(message, type) {
      if (typeof this.statusMessage === 'string') {
        this.statusMessage = [this.statusMessage];
      }
      if (this.statusMessage === null) {
        this.statusMessage = message;
      } else {
        this.statusMessage.push(message);
      }
      this.statusType = type;
    },
  };
}
