/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IFormSubmitContext {
  type: string;
  submitOnNoChanges: boolean;
  setType(type: string): void;
  setSubmitOnNoChanges(submitOnNoChanges: boolean): void;
}

export function formSubmitContext(): IFormSubmitContext {
  return {
    type: 'submit',
    submitOnNoChanges: false,
    setType(type) {
      this.type = type;
    },
    setSubmitOnNoChanges(submitOnNoChanges) {
      this.submitOnNoChanges = submitOnNoChanges;
    },
  };
}
