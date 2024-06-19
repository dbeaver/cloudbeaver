/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { DataContext, dataContextAddDIProvider, DataContextGetter, type IDataContext } from '@cloudbeaver/core-data-context';
import type { App } from '@cloudbeaver/core-di';
import type { ENotificationType } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import { isLoadableStateHasException, MetadataMap, uuid } from '@cloudbeaver/core-utils';
import { DATA_CONTEXT_LOADABLE_STATE, loadableStateContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_FORM_STATE } from './DATA_CONTEXT_FORM_STATE';
import type { FormBaseService } from './FormBaseService';
import { FormMode } from './FormMode';
import { formStateContext } from './formStateContext';
import type { IFormPart } from './IFormPart';
import type { IFormState } from './IFormState';

export class FormState<TState> implements IFormState<TState> {
  mode: FormMode;
  parts: MetadataMap<string, IFormPart<any>>;
  state: TState;
  isSaving: boolean;

  statusMessage: string | string[] | null;
  statusType: ENotificationType | null;
  exception: Error | (Error | null)[] | null;

  promise: Promise<any> | null;

  get isDisabled(): boolean {
    return this.isSaving || this.isLoading();
  }

  readonly id: string;
  readonly service: FormBaseService<TState, any>;
  readonly dataContext: IDataContext;

  readonly configureTask: IExecutor<IFormState<TState>>;
  readonly formStateTask: IExecutor<TState>;
  readonly fillDefaultConfigTask: IExecutor<IFormState<TState>>;
  readonly submitTask: IExecutor<IFormState<TState>>;
  readonly formatTask: IExecutor<IFormState<TState>>;
  readonly validationTask: IExecutor<IFormState<TState>>;

  constructor(app: App, service: FormBaseService<TState, any>, state: TState) {
    this.id = uuid();
    this.service = service;
    this.dataContext = new DataContext();

    this.mode = FormMode.Create;
    this.parts = new MetadataMap<string, any>();
    this.state = state;
    this.isSaving = false;

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

    this.formatTask = new Executor(this as IFormState<TState>, () => true);
    this.formatTask.addCollection(service.onFormat);

    this.validationTask = new Executor(this as IFormState<TState>, () => true);
    this.validationTask.addCollection(service.onValidate).before(this.formatTask);

    this.submitTask = new Executor(this as IFormState<TState>, () => true);
    this.submitTask.addCollection(service.onSubmit).before(this.validationTask);

    this.dataContext.set(DATA_CONTEXT_LOADABLE_STATE, loadableStateContext(), this.id);
    this.dataContext.set(DATA_CONTEXT_FORM_STATE, this, this.id);
    dataContextAddDIProvider(this.dataContext, app, this.id);

    makeObservable<this>(this, {
      mode: observable,
      parts: observable.ref,
      promise: observable.ref,
      exception: observable.ref,
      isSaving: observable.ref,
      state: observable,
      isDisabled: computed,
      setMode: action,
      setPartsState: action,
      setException: action,
      setState: action,
    });
  }

  isLoading(): boolean {
    return this.promise !== null || this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE)!.loaders.some(loader => loader.isLoading());
  }

  isLoaded(): boolean {
    if (this.promise) {
      return false;
    }
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE)!.loaders.every(loader => loader.isLoaded());
  }

  isError(): boolean {
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE)!.loaders.some(loader => loader.isError());
  }

  isOutdated(): boolean {
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE)!.loaders.some(loader => loader.isOutdated?.() === true);
  }

  isCancelled(): boolean {
    return this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE)!.loaders.some(loader => loader.isCancelled?.() === true);
  }

  isChanged(): boolean {
    return Array.from(this.parts.values()).some(part => part.isChanged());
  }

  getPart<T extends IFormPart<any>>(getter: DataContextGetter<T>, init: (context: IDataContext, id: string) => T): T {
    return this.parts.get(getter.id, () => {
      if (this.dataContext.has(getter)) {
        return this.dataContext.get(getter)!;
      }

      const part = init(this.dataContext, this.id);
      this.dataContext.set(getter, part, this.id);
      return part;
    }) as T;
  }

  async load(refresh?: boolean): Promise<void> {
    if (this.promise !== null) {
      return this.promise;
    }

    if (this.isLoaded() && !this.isOutdated() && !refresh) {
      if (this.mode === FormMode.Create) {
        await this.fillDefaultConfigTask.execute(this);
      }
      return;
    }

    this.promise = (async () => {
      try {
        await this.configureTask.execute(this);

        const loaders = this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE)!.loaders;

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
        this.promise = null;
      }
    })();
  }

  async reload(): Promise<void> {
    await this.load(true);
  }

  cancel(): void {
    const loaders = this.dataContext.get(DATA_CONTEXT_LOADABLE_STATE)!.loaders;

    for (const loader of loaders) {
      if (loader.isCancelled?.() !== true) {
        loader.cancel?.();
      }
    }
  }

  reset(): void {
    for (const part of this.parts.values()) {
      part.reset();
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
      this.isSaving = true;
      const context = await this.submitTask.execute(this);

      if (ExecutorInterrupter.isInterrupted(context)) {
        return false;
      }

      this.exception = null;
      return true;
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.isSaving = false;
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
