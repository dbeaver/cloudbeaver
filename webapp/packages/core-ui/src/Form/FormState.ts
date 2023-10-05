/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { dataContextAddDIProvider, type IDataContext, TempDataContext } from '@cloudbeaver/core-data-context';
import type { App } from '@cloudbeaver/core-di';
import type { ENotificationType } from '@cloudbeaver/core-events';
import { Executor, IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import { isLoadableStateHasException, MetadataMap, uuid } from '@cloudbeaver/core-utils';
import { DATA_CONTEXT_LOADABLE_STATE, loadableStateContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_FORM_STATE } from './DATA_CONTEXT_FORM_STATE';
import type { FormBaseService } from './FormBaseService';
import { FormMode } from './FormMode';
import { formStateContext } from './formStateContext';
import type { IFormState } from './IFormState';

export class FormState<TState> implements IFormState<TState> {
  mode: FormMode;
  parts: MetadataMap<string, any>;
  state: TState;
  isDisabled: boolean;

  statusMessage: string | string[] | null;
  statusType: ENotificationType | null;
  exception: Error | (Error | null)[] | null;

  promise: Promise<any> | null;

  readonly id: string;
  readonly service: FormBaseService<TState, any>;
  readonly dataContext: IDataContext;

  readonly configureTask: IExecutor<IFormState<TState>>;
  readonly formStateTask: IExecutor<TState>;
  readonly fillDefaultConfigTask: IExecutor<IFormState<TState>>;
  readonly submitTask: IExecutor<IFormState<TState>>;
  readonly validationTask: IExecutor<IFormState<TState>>;

  constructor(app: App, service: FormBaseService<TState, any>, state: TState) {
    this.id = uuid();
    this.service = service;
    this.dataContext = new TempDataContext();

    this.mode = FormMode.Create;
    this.parts = new MetadataMap<string, any>();
    this.state = state;
    this.isDisabled = false;

    this.statusMessage = null;
    this.statusType = null;
    this.exception = null;

    this.promise = null;

    this.configureTask = new Executor(this as IFormState<TState>, () => true);
    this.configureTask.addCollection(service.onConfigure);

    this.formStateTask = new Executor<TState>(state, () => true);
    this.formStateTask.addCollection(service.onState).addPostHandler(this.updateFormState.bind(this));

    this.fillDefaultConfigTask = new Executor(this as IFormState<TState>, () => true);
    this.fillDefaultConfigTask.addCollection(service.onFillDefaultConfig).next(this.formStateTask, form => form.state);

    this.validationTask = new Executor(this as IFormState<TState>, () => true);
    this.validationTask.addCollection(service.onValidate);

    this.submitTask = new Executor(this as IFormState<TState>, () => true);
    this.submitTask.addCollection(service.onSubmit).before(this.validationTask);

    this.dataContext.set(DATA_CONTEXT_LOADABLE_STATE, loadableStateContext());
    this.dataContext.set(DATA_CONTEXT_FORM_STATE, this);
    dataContextAddDIProvider(this.dataContext, app);

    makeObservable<this>(this, {
      mode: observable,
      parts: observable.ref,
      promise: observable.ref,
      exception: observable.ref,
      isDisabled: observable.ref,
      state: observable,
      setMode: action,
      setPartsState: action,
      setException: action,
      setState: action,
    });
  }

  isLoading(): boolean {
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE).loaders.some(loader => loader.isLoading());
  }

  isLoaded(): boolean {
    if (this.promise) {
      return false;
    }
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE).loaders.every(loader => loader.isLoaded());
  }

  isError(): boolean {
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE).loaders.some(loader => loader.isError());
  }

  isOutdated(): boolean {
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE).loaders.some(loader => loader.isOutdated?.() === true);
  }

  isCancelled(): boolean {
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE).loaders.some(loader => loader.isCancelled?.() === true);
  }

  async load(refresh?: boolean): Promise<void> {
    if (this.promise !== null) {
      return this.promise;
    }

    if (this.isLoaded() && !this.isOutdated() && !refresh) {
      return;
    }

    this.promise = (async () => {
      try {
        this.isDisabled = true;
        await this.configureTask.execute(this);

        const loaders = this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE).loaders;

        for (const loader of loaders) {
          if (isLoadableStateHasException(loader)) {
            continue;
          }

          if (!loader.isLoaded() || loader.isOutdated?.() === true) {
            try {
              await loader.load();
            } catch {
              return;
            }
          }
        }

        await this.fillDefaultConfigTask.execute(this);
        this.exception = null;
      } catch (exception: any) {
        this.exception = exception;
        throw exception;
      } finally {
        this.isDisabled = false;
        this.promise = null;
      }
    })();
  }

  async reload(): Promise<void> {
    await this.load(true);
  }

  cancel(): void {
    const loaders = this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE).loaders;

    for (const loader of loaders) {
      if (loader.isCancelled?.() !== true) {
        loader.cancel?.();
      }
    }
  }

  setMode(mode: FormMode): this {
    this.mode = mode;
    return this;
  }

  setPartsState(state: MetadataMap<string, any>): this {
    this.parts = state;
    return this;
  }

  setException(exception: Error | (Error | null)[] | null): this {
    this.exception = exception;
    return this;
  }

  setState(state: TState): this {
    this.state = state;
    return this;
  }

  async save(): Promise<boolean> {
    try {
      this.isDisabled = true;
      await this.submitTask.execute(this);

      this.exception = null;
      return true;
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.isDisabled = false;
    }
    return false;
  }

  private updateFormState(data: TState, contexts: IExecutionContextProvider<TState>): void {
    const context = contexts.getContext(formStateContext);

    if (this.mode === FormMode.Create) {
      context.markEdited();
    }

    this.statusMessage = context.statusMessage;
    this.statusType = context.statusType;
  }
}
