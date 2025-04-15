/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable, toJS } from 'mobx';

import { executorHandlerFilter, ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isObjectsEqual } from '@cloudbeaver/core-utils';

import type { IFormPart } from './IFormPart.js';
import type { IFormState } from './IFormState.js';
import { formSubmitContext } from './formSubmitContext.js';

export abstract class FormPart<TPartState, TFormState = any> implements IFormPart<TPartState> {
  state: TPartState;
  initialState: TPartState;
  isSaving: boolean;

  exception: Error | null;
  promise: Promise<any> | null;

  protected loaded: boolean;
  protected loading: boolean;

  constructor(
    protected readonly formState: IFormState<TFormState>,
    initialState: TPartState,
  ) {
    this.initialState = initialState;
    this.state = toJS(this.initialState);
    this.isSaving = false;

    this.exception = null;
    this.promise = null;

    this.loaded = false;
    this.loading = false;

    this.formState.submitTask.addHandler(executorHandlerFilter(() => this.isLoaded(), this.save.bind(this)));
    this.formState.formatTask.addHandler(executorHandlerFilter(() => this.isLoaded() && this.isChanged, this.format.bind(this)));
    this.formState.validationTask.addHandler(executorHandlerFilter(() => this.isLoaded(), this.handleValidation.bind(this)));

    makeObservable<this, 'loaded' | 'loading' | 'setInitialState'>(this, {
      initialState: observable,
      state: observable,
      exception: observable.ref,
      promise: observable.ref,
      isSaving: observable.ref,
      loaded: observable,
      loading: observable,
      setInitialState: action,
      isDisabled: computed,
      isChanged: computed,
    });
  }

  get isDisabled(): boolean {
    return this.isSaving || this.isLoading();
  }

  isLoading(): boolean {
    return this.loading;
  }

  isOutdated(): boolean {
    return false;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  isError(): boolean {
    return this.exception !== null;
  }

  get isChanged(): boolean {
    if (!this.loaded || this.initialState === this.state) {
      return false;
    }

    return !isObjectsEqual(this.initialState, this.state);
  }

  async save(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): Promise<void> {
    if (this.loading) {
      return;
    }

    this.loading = true;

    try {
      await this.loader();
      const formSubmit = contexts.getContext(formSubmitContext);

      if (!this.isChanged && !formSubmit.submitOnNoChanges) {
        return;
      }

      this.isSaving = true;

      await this.saveChanges(data, contexts);
      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return;
      }

      this.loaded = false;
      this.exception = null;
    } catch (exception: any) {
      this.exception = exception;
      throw exception;
    } finally {
      this.isSaving = false;
      this.loading = false;
    }
  }

  async load(): Promise<void> {
    if (this.loading) {
      return this.promise;
    }

    try {
      this.loading = true;
      this.promise = this.loader();

      await this.promise;
      this.exception = null;
      await this.formState.loadedTask.execute(this.formState);
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.loaded = true;
      this.promise = null;
      this.loading = false;
    }
  }

  async reload(): Promise<void> {
    this.loaded = false;
    await this.load();
  }

  reset(): void {
    this.setState(toJS(this.initialState));
  }

  private async handleValidation(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): Promise<void> {
    try {
      this.exception = null;
      await this.validate(data, contexts);
    } catch (exception: any) {
      this.exception = exception;
    }
  }

  protected setInitialState(initialState: TPartState): void {
    const isChanged = this.isChanged;

    this.initialState = initialState;

    if (isChanged) {
      return;
    }

    this.setState(toJS(this.initialState));
  }

  protected setState(state: TPartState): void {
    this.state = state;
  }

  protected format(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): void | Promise<void> {}
  protected validate(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): void | Promise<void> {}

  protected abstract loader(): Promise<void>;
  protected abstract saveChanges(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): Promise<void>;
  dispose(): void | Promise<void> {}
}
