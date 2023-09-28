/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ENotificationType } from '@cloudbeaver/core-events';
import type { IExecutor } from '@cloudbeaver/core-executor';
import type { ILoadableState, MetadataMap } from '@cloudbeaver/core-utils';
import type { IDataContext } from '@cloudbeaver/core-view';

import type { FormBaseService } from './FormBaseService';
import type { FormMode } from './FormMode';

export interface IFormState<TState> extends ILoadableState {
  readonly id: string;
  readonly service: FormBaseService<TState>;
  readonly dataContext: IDataContext;

  readonly mode: FormMode;
  readonly parts: MetadataMap<string, any>;
  readonly state: TState;
  readonly isDisabled: boolean;

  readonly promise: Promise<any> | null;

  readonly exception: Error | (Error | null)[] | null;
  readonly statusMessage: string | string[] | null;
  readonly statusType: ENotificationType | null;

  readonly configureTask: IExecutor<IFormState<TState>>;
  readonly formStateTask: IExecutor<TState>;
  readonly fillDefaultConfigTask: IExecutor<IFormState<TState>>;
  readonly submitTask: IExecutor<IFormState<TState>>;
  readonly validationTask: IExecutor<IFormState<TState>>;

  setMode(mode: FormMode): this;
  setPartsState(state: MetadataMap<string, any>): this;
  setException(exception: Error | (Error | null)[] | null): this;
  setState(state: TState): this;

  isLoading(): boolean;
  isLoaded(): boolean;
  isError(): boolean;
  isOutdated(): boolean;
  isCancelled(): boolean;

  load(): Promise<void>;
  reload(): Promise<void>;
  save(): Promise<boolean>;
  cancel(): void;
}
