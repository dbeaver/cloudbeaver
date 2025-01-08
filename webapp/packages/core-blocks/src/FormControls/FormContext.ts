/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { IExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

export type FormChangeValues = string | number | boolean | FileList | null | undefined;
export type FormChangeHandler = (value: FormChangeValues, name: string | undefined) => void;
type KeyHandler = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

export interface IChangeData {
  value: FormChangeValues;
  name: string | undefined;
}

export interface IFormContext {
  ref: HTMLFormElement | null;
  onValidate: SyncExecutor;
  onSubmit: IExecutor<SubmitEvent | undefined>;
  onChange: IExecutor<IChangeData>;
  parent: IFormContext | null;
  disableEnterSubmit: boolean;
  setRef: (ref: HTMLFormElement | null) => void;
  change: FormChangeHandler;
  keyDown: KeyHandler;
  validate: () => boolean;
  reportValidity: () => boolean;
  submit: (event?: SubmitEvent) => Promise<void>;
}

export const FormContext = createContext<IFormContext | null>(null);
