/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ILoadableState } from '@cloudbeaver/core-utils';

export interface IFormPart<TState> extends ILoadableState {
  state: TState;
  initialState: TState;

  isChanged(): boolean;

  load(): Promise<void>;
  save(): Promise<void>;
  reset(): void;
}
