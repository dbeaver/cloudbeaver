/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { IExecutor } from '@cloudbeaver/core-executor';

export type FormChangeValues = string | number | boolean | FileList | null | undefined;
export type FormChangeHandler = (value: FormChangeValues, name: string | undefined) => void;
type KeyHandler = (event: React.KeyboardEvent<HTMLInputElement>) => void;

export interface IChangeData {
  value: FormChangeValues;
  name: string | undefined;
}

export interface IFormContext {
  changeExecutor: IExecutor<IChangeData>;
  change: FormChangeHandler;
  keyDown: KeyHandler;
}

export const FormContext = createContext<IFormContext | null>(null);
