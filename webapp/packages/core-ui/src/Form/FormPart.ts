/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, toJS } from 'mobx';

import { executorHandlerFilter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isObjectsEqual } from '@cloudbeaver/core-utils';

import type { IFormPart } from './IFormPart';
import type { IFormState } from './IFormState';

export abstract class FormPart<TPartState, TFormState = any> implements IFormPart<TPartState> {
  state: TPartState;
  initialState: TPartState;

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

    this.exception = null;
    this.promise = null;

    this.loaded = false;
    this.loading = false;

    this.formState.submitTask.addHandler(executorHandlerFilter(() => this.isLoaded(), this.save.bind(this)));
    this.formState.configureTask.addHandler(executorHandlerFilter(() => this.isLoaded(), this.configure.bind(this)));
    this.formState.formatTask.addHandler(executorHandlerFilter(() => this.isLoaded(), this.format.bind(this)));
    this.formState.validationTask.addHandler(executorHandlerFilter(() => this.isLoaded(), this.validate.bind(this)));

    makeObservable<this, 'loaded' | 'loading' | 'setInitialState'>(this, {
      initialState: observable,
      state: observable,
      exception: observable.ref,
      promise: observable.ref,
      loaded: observable,
      loading: observable,
      setInitialState: action,
    });
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

  isChanged(): boolean {
    if (!this.loaded || this.initialState === this.state) {
      return false;
    }

    return !isObjectsEqual(this.initialState, this.state);
  }

  async save(): Promise<any> {
    if (this.loading) {
      return;
    }
    this.loading = true;

    try {
      await this.loader();

      if (!this.isChanged()) {
        return;
      }

      await this.saveChanges();

      this.loaded = false;
      this.exception = null;
    } catch (exception: any) {
      this.exception = exception;
      throw exception;
    } finally {
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
      this.loaded = true;
      this.exception = null;
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.promise = null;
      this.loading = false;
    }
  }

  async reload(): Promise<void> {
    this.loaded = false;
    await this.load();
  }

  reset() {
    this.setState(toJS(this.initialState));
  }

  protected setInitialState(initialState: TPartState) {
    this.initialState = initialState;

    if (this.isChanged()) {
      return;
    }

    this.setState(toJS(this.initialState));
  }

  protected setState(state: TPartState) {
    this.state = state;
  }

  protected configure(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): void | Promise<void> {}
  protected format(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): void | Promise<void> {}
  protected validate(data: IFormState<TFormState>, contexts: IExecutionContextProvider<IFormState<TFormState>>): void | Promise<void> {}

  protected abstract loader(): Promise<void>;
  protected abstract saveChanges(): Promise<void>;
}
