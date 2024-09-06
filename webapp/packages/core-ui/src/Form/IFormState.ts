/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataContextGetter, IDataContext } from '@cloudbeaver/core-data-context';
import type { ENotificationType } from '@cloudbeaver/core-events';
import type { IExecutor } from '@cloudbeaver/core-executor';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { FormBaseService } from './FormBaseService';
import type { FormMode } from './FormMode';
import type { IFormPart } from './IFormPart';

export interface IFormState<TState> {
  readonly id: string;
  readonly service: FormBaseService<TState>;
  readonly dataContext: IDataContext;

  readonly mode: FormMode;
  readonly parts: MetadataMap<string, any>;
  readonly state: TState;
  readonly isDisabled: boolean;

  readonly promise: Promise<any> | null;

  readonly statusMessage: string | string[] | null;
  readonly statusType: ENotificationType | null;

  readonly configureTask: IExecutor<IFormState<TState>>;
  readonly formStateTask: IExecutor<TState>;
  readonly fillDefaultConfigTask: IExecutor<IFormState<TState>>;
  readonly submitTask: IExecutor<IFormState<TState>>;
  readonly formatTask: IExecutor<IFormState<TState>>;
  readonly validationTask: IExecutor<IFormState<TState>>;

  setMode(mode: FormMode): this;
  setPartsState(state: MetadataMap<string, any>): this;
  setState(state: TState): this;

  getPart<T extends IFormPart<any>>(getter: DataContextGetter<T>, init: (context: IDataContext, id: string) => T): T;

  isError: boolean; // dont touch it
  isCancelled: boolean; // dont touch it???
  isChanged: boolean; // dont touch it

  load(): Promise<void>;
  reload(): Promise<void>;
  save(): Promise<boolean>;
  reset(): void;
  cancel(): void;
}
