/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { DataContext, dataContextAddDIProvider, type DataContextGetter, type IDataContext } from '@cloudbeaver/core-data-context';
import type { IServiceProvider } from '@cloudbeaver/core-di';
import type { ENotificationType } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import { isArraysEqual, isNotNullDefined, MetadataMap, uuid } from '@cloudbeaver/core-utils';
import { DATA_CONTEXT_LOADABLE_STATE, loadableStateContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_FORM_STATE } from './DATA_CONTEXT_FORM_STATE.js';
import type { FormBaseService } from './FormBaseService.js';
import { FormMode } from './FormMode.js';
import { formStateContext } from './formStateContext.js';
import type { IFormPart } from './IFormPart.js';
import type { IFormState } from './IFormState.js';

export class FormState<TState> implements IFormState<TState> {
  mode: FormMode;
  parts: MetadataMap<string, IFormPart<any>>;
  state: TState;

  statusMessage: string | string[] | null;
  statusType: ENotificationType | null;

  savingPromise: Promise<any> | null;

  get isDisabled(): boolean {
    return this.partsValues.some(part => part.isSaving || part?.isLoading?.());
  }

  get isSaving(): boolean {
    return this.partsValues.some(part => part.isSaving);
  }

  readonly id: string;
  readonly service: FormBaseService<TState, any>;
  readonly dataContext: IDataContext;

  readonly formStateTask: IExecutor<TState>;
  readonly loadedTask: IExecutor<IFormState<TState>>;
  readonly submitTask: IExecutor<IFormState<TState>>;
  readonly formatTask: IExecutor<IFormState<TState>>;
  readonly validationTask: IExecutor<IFormState<TState>>;
  readonly disposeTask: IExecutor<IFormState<TState>>;

  constructor(serviceProvider: IServiceProvider, service: FormBaseService<TState, any>, state: TState) {
    this.id = uuid();
    this.service = service;
    this.dataContext = new DataContext();

    this.mode = FormMode.Create;
    this.parts = new MetadataMap<string, any>();
    this.state = state;

    this.statusMessage = null;
    this.statusType = null;

    this.savingPromise = null;

    this.formStateTask = new Executor<TState>(state, () => true);
    this.formStateTask.addCollection(service.onState).addPostHandler(this.updateFormState.bind(this));

    this.loadedTask = new Executor(this as IFormState<TState>, () => true);
    this.loadedTask.addCollection(service.onLoaded).next(this.formStateTask).addPostHandler(this.onLoadedHandler.bind(this));

    this.formatTask = new Executor(this as IFormState<TState>, () => true);
    this.formatTask.addCollection(service.onFormat);

    this.validationTask = new Executor(this as IFormState<TState>, () => true);
    this.validationTask.addCollection(service.onValidate).before(this.formatTask);

    this.submitTask = new Executor(this as IFormState<TState>, () => true);
    this.submitTask.addCollection(service.onSubmit).before(this.validationTask);

    this.disposeTask = new Executor(this as IFormState<TState>, () => true);

    this.dataContext.set(DATA_CONTEXT_LOADABLE_STATE, loadableStateContext(), this.id);
    this.dataContext.set(DATA_CONTEXT_FORM_STATE, this, this.id);
    dataContextAddDIProvider(this.dataContext, serviceProvider, this.id);

    makeObservable<this, 'updateFormState'>(this, {
      mode: observable,
      parts: observable.ref,
      savingPromise: observable.ref,
      state: observable,
      isSaving: computed,
      exception: computed,
      isDisabled: computed,
      setMode: action,
      setPartsState: action,
      setState: action,
      updateFormState: action,
      isChanged: computed,
      partsValues: computed<IFormPart<any>[]>({
        equals: isArraysEqual,
      }),
      isError: computed,
      isCancelled: computed,
    });
  }

  get partsValues() {
    return Array.from(this.parts.values());
  }

  get exception(): Error | (Error | null)[] | null {
    return this.partsValues
      .map(part => part?.exception)
      .flat()
      .filter(isNotNullDefined);
  }

  get isError(): boolean {
    return this.partsValues.some(part => part.isError());
  }

  get isCancelled(): boolean {
    return this.partsValues.some(part => part?.isCancelled?.());
  }

  get isChanged(): boolean {
    return this.partsValues.some(part => part.isChanged);
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

  setState(state: TState): this {
    this.state = state;
    return this;
  }

  async save(): Promise<boolean> {
    try {
      this.savingPromise = this.submitTask.execute(this);
      const context = await this.savingPromise;

      if (ExecutorInterrupter.isInterrupted(context)) {
        return false;
      }

      return true;
    } catch (exception: any) {
    } finally {
      this.savingPromise = null;
    }

    return false;
  }

  private onLoadedHandler(data: IFormState<TState>, contexts: IExecutionContextProvider<IFormState<TState>>): void {
    for (const part of this.parts.values()) {
      if (!part.isLoaded()) {
        ExecutorInterrupter.interrupt(contexts);
        return;
      }
    }
  }

  private updateFormState(data: TState, contexts: IExecutionContextProvider<TState>): void {
    const context = contexts.getContext(formStateContext);

    if (this.mode === FormMode.Create) {
      context.markEdited();
    }

    this.statusMessage = context.statusMessage;
    this.statusType = context.statusType;
  }

  async dispose(): Promise<void> {
    if (this.savingPromise) {
      await this.savingPromise;
    }

    for (const part of this.parts.values()) {
      await part.dispose();
    }

    await this.disposeTask.execute(this);
  }
}
